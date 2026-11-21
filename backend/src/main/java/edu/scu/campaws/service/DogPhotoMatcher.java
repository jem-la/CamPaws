package edu.scu.campaws.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;

import edu.scu.campaws.domain.DogProfile;
import edu.scu.campaws.dto.DogPhotoMatch;
import edu.scu.campaws.dto.DogProfileResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.FloatBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Matches an uploaded photo against saved dogs using DINOv2 embeddings and cosine similarity.
 * Stored photo embeddings are cached in memory. Without the model file it returns no matches.
 */
@Service
public class DogPhotoMatcher {
    private static final Logger log = LoggerFactory.getLogger(DogPhotoMatcher.class);
    private static final String PHOTO_PATH = "/api/photos/";
    private static final int MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;
    private static final int SIZE = 224;
    private static final int RESIZE = 256;
    private static final float[] MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] STD = {0.229f, 0.224f, 0.225f};

    private final DogCatalog catalog;
    private final PhotoStorage storage;
    private final double threshold;
    private final Path modelPath;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NEVER)
            .build();
    private final Map<String, float[]> cache = new ConcurrentHashMap<>();

    private OrtEnvironment env;
    private OrtSession session;
    private String inputName;
    private boolean loaded;

    public DogPhotoMatcher(
            DogCatalog catalog,
            PhotoStorage storage,
            @Value("${campaws.match.threshold:0.60}") double threshold,
            @Value("${campaws.match.model:models/dinov2-small.onnx}") String model) {
        this.catalog = catalog;
        this.storage = storage;
        this.threshold = threshold;
        this.modelPath = Path.of(model).toAbsolutePath().normalize();
    }

    public List<DogPhotoMatch> match(byte[] image) throws IOException {
        if (!ensureLoaded()) return List.of();
        float[] query = embed(read(image));
        if (query == null) {
            throw new IllegalArgumentException("That photo couldn't be read. Try a JPEG or PNG.");
        }

        List<DogPhotoMatch> matches = new ArrayList<>();
        for (DogProfile dog : catalog.allDogs()) {
            double best = 0;
            for (String url : dog.getPhotoUrls()) {
                float[] other = storedEmbedding(url);
                if (other != null) best = Math.max(best, dot(query, other));
            }
            if (best >= threshold) {
                matches.add(new DogPhotoMatch(DogProfileResponse.from(dog), Math.min(1.0, best)));
            }
        }
        matches.sort(Comparator.comparingDouble(DogPhotoMatch::similarity).reversed());
        return matches;
    }

    private synchronized boolean ensureLoaded() {
        if (loaded) return session != null;
        loaded = true;
        if (!Files.isRegularFile(modelPath)) {
            log.warn("Dog photo matching is off: {} not found. Run scripts/download-model.sh.", modelPath);
            return false;
        }
        try {
            env = OrtEnvironment.getEnvironment();
            session = env.createSession(modelPath.toString(), new OrtSession.SessionOptions());
            inputName = session.getInputNames().iterator().next();
            log.info("Dog photo matching ready (threshold {}).", threshold);
        } catch (OrtException | RuntimeException | UnsatisfiedLinkError e) {
            log.warn("Dog photo matching is off: couldn't load the model ({}).", e.getMessage());
            session = null;
        }
        return session != null;
    }

    private float[] storedEmbedding(String url) {
        if (url == null) return null;
        int at = url.indexOf(PHOTO_PATH);
        boolean ours = at >= 0;
        String key = ours ? url.substring(at + PHOTO_PATH.length()) : url;
        float[] cached = cache.get(key);
        if (cached != null) return cached.length == 0 ? null : cached;
        float[] vector = null;
        try {
            byte[] bytes = ours ? Files.readAllBytes(storage.load(key)) : download(url);
            vector = bytes == null ? null : embed(read(bytes));
        } catch (RuntimeException | IOException e) {
            // Missing or unreadable file (for example HEIC): skip this photo.
        }
        cache.put(key, vector == null ? new float[0] : vector);
        return vector;
    }

    /** Only public https hosts, no redirects, so a saved URL can't point the server at its own network. */
    private byte[] download(String url) {
        try {
            URI uri = URI.create(url);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) return null;
            for (InetAddress address : InetAddress.getAllByName(uri.getHost())) {
                if (address.isAnyLocalAddress() || address.isLoopbackAddress() || address.isLinkLocalAddress()
                        || address.isSiteLocalAddress() || address.isMulticastAddress()) {
                    return null;
                }
            }
            HttpResponse<byte[]> response = http.send(
                    HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(8)).GET().build(),
                    HttpResponse.BodyHandlers.ofByteArray());
            byte[] body = response.body();
            return response.statusCode() == 200 && body.length <= MAX_DOWNLOAD_BYTES ? body : null;
        } catch (IOException | IllegalArgumentException e) {
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
    }

    private static BufferedImage read(byte[] bytes) throws IOException {
        try (InputStream in = new ByteArrayInputStream(bytes)) {
            return ImageIO.read(in);
        }
    }

    private float[] embed(BufferedImage image) {
        if (image == null) return null;
        try (OnnxTensor input = OnnxTensor.createTensor(
                env, FloatBuffer.wrap(preprocess(image)), new long[] {1, 3, SIZE, SIZE});
             OrtSession.Result result = session.run(Map.of(inputName, input))) {
            float[][][] hidden = (float[][][]) result.get(0).getValue(); // [1][tokens][dim]
            float[] cls = hidden[0][0].clone();
            double norm = 0;
            for (float v : cls) norm += v * v;
            norm = Math.sqrt(norm);
            if (norm == 0) return null;
            for (int i = 0; i < cls.length; i++) cls[i] /= (float) norm;
            return cls;
        } catch (OrtException e) {
            log.warn("Photo embedding failed: {}", e.getMessage());
            return null;
        }
    }

    private static float[] preprocess(BufferedImage src) {
        int w = src.getWidth(), h = src.getHeight();
        double scale = (double) RESIZE / Math.min(w, h);
        int nw = Math.max(SIZE, (int) Math.round(w * scale));
        int nh = Math.max(SIZE, (int) Math.round(h * scale));
        BufferedImage scaled = new BufferedImage(nw, nh, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();

        int x0 = (nw - SIZE) / 2, y0 = (nh - SIZE) / 2;
        float[] data = new float[3 * SIZE * SIZE];
        for (int y = 0; y < SIZE; y++) {
            for (int x = 0; x < SIZE; x++) {
                int rgb = scaled.getRGB(x0 + x, y0 + y);
                float[] c = {(rgb >> 16 & 0xff) / 255f, (rgb >> 8 & 0xff) / 255f, (rgb & 0xff) / 255f};
                for (int k = 0; k < 3; k++) {
                    data[k * SIZE * SIZE + y * SIZE + x] = (c[k] - MEAN[k]) / STD[k];
                }
            }
        }
        return data;
    }

    private static double dot(float[] a, float[] b) {
        double sum = 0;
        for (int i = 0; i < a.length; i++) sum += a[i] * b[i];
        return sum;
    }
}
