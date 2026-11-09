package edu.scu.campaws.service;

import edu.scu.campaws.domain.DogProfile;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Fills an empty database with sample campus dogs on startup so the app has something
 * to show. Turn off with {@code campaws.seed.enabled=false}.
 */
@Component
@ConditionalOnProperty(name = "campaws.seed.enabled", havingValue = "true", matchIfMissing = true)
public class SampleDogSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(SampleDogSeeder.class);

    /** One sample dog. Coordinates are spots around Santa Clara University. */
    private record Sample(
            String name,
            String furColor,
            String temperament,
            String pettingPolicy,
            String campusFrequency,
            String location,
            String about,
            int likes,
            double latitude,
            double longitude,
            String addedBy,
            List<String> photoUrls) { }

    private static final String ALEX = "Alex Lee";

    private static final List<Sample> SAMPLES = List.of(
            new Sample("Mochi", "Tan and white", "Friendly", "yes", "Every day", "Library lawn",
                    "Mochi naps in the sun outside the library and greets everyone heading to class.",
                    42, 37.3489, -121.9386, ALEX,
                    List.of("https://images.dog.ceo/breeds/shiba/shiba-7.jpg",
                            "https://images.dog.ceo/breeds/shiba/shiba-11.jpg")),
            new Sample("Luna", "Golden", "Playful", "yes", "Most weekdays", "Benson Center",
                    "Luna will bring you a tennis ball and expect you to throw it. Repeatedly.",
                    37, 37.3497, -121.9405, "Priya Shah",
                    List.of("https://images.dog.ceo/breeds/retriever-golden/n02099601_9504.jpg",
                            "https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg")),
            new Sample("Pepper", "Black and white", "Energetic", "ask", "Weekends", "Mission Gardens",
                    "Pepper herds anyone who walks through the gardens. Ask her owner before petting.",
                    29, 37.3492, -121.9419, "Jordan Kim",
                    List.of("https://images.dog.ceo/breeds/australian-shepherd/pepper2.jpg")),
            new Sample("Biscuit", "Brown and white", "Calm", "yes", "Most weekdays", "Malley Fitness Center",
                    "Biscuit waits patiently outside Malley while his human works out.",
                    21, 37.3478, -121.9411, ALEX,
                    List.of("https://images.dog.ceo/breeds/corgi-cardigan/n02113186_2419.jpg")),
            new Sample("Koda", "Gray and white", "Energetic", "ask", "A few times a month", "Bellomy Field",
                    "Koda loves running laps around Bellomy Field. Very vocal, very friendly.",
                    18, 37.3466, -121.9398, "Sam Rivera",
                    List.of("https://images.dog.ceo/breeds/husky/n02110185_14056.jpg")),
            new Sample("Hazel", "Chocolate", "Friendly", "yes", "Every day", "Learning Commons",
                    "Hazel is the unofficial study buddy of the Learning Commons. Finals-week favorite.",
                    33, 37.3486, -121.9391, "Priya Shah",
                    List.of("https://images.dog.ceo/breeds/labrador/n02099712_4428.jpg")),
            new Sample("Noodle", "Cream", "Shy", "no", "Rarely", "Swig Hall",
                    "Noodle is a little shy around crowds. Wave from a distance and she might come say hi.",
                    9, 37.3502, -121.9378, ALEX,
                    List.of("https://images.dog.ceo/breeds/poodle-toy/n02113624_454.jpg")),
            new Sample("Waffles", "Tan and white", "Playful", "yes", "Weekends", "Alameda walkway",
                    "Waffles follows his nose everywhere. Keep your snacks close.",
                    14, 37.3509, -121.9396, "Jordan Kim",
                    List.of("https://images.dog.ceo/breeds/beagle/n02088364_14663.jpg")),
            new Sample("Pickles", "Tan and black", "Calm", "yes", "Most weekdays", "Vari Hall",
                    "Pickles snores loudly under the benches by Vari Hall.",
                    25, 37.3481, -121.9370, "Sam Rivera",
                    List.of("https://images.dog.ceo/breeds/pug/n02110958_2154.jpg")),
            new Sample("Snowball", "White", "Friendly", "yes", "A few times a month", "Mission Church",
                    "Snowball is a fluffy cloud who loves belly rubs on the church steps.",
                    31, 37.3494, -121.9412, "Priya Shah",
                    List.of("https://images.dog.ceo/breeds/samoyed/n02111889_5145.jpg")),
            new Sample("Bean", "Brindle", "Protective", "ask", "Every day", "Kenna Hall",
                    "Bean keeps an eye on Kenna Hall. Let him sniff your hand before petting.",
                    11, 37.3475, -121.9383, "Jordan Kim",
                    List.of("https://images.dog.ceo/breeds/bulldog-french/n02108915_5201.jpg"))
    );

    private final DogCatalog catalog;

    public SampleDogSeeder(DogCatalog catalog) {
        this.catalog = catalog;
    }

    /** Runs once on an empty database; existing data is never touched. */
    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (catalog.getDogCount() > 0) {
            return;
        }

        for (Sample s : SAMPLES) {
            DogProfile dog = catalog.newDogProfile(
                    s.name(),
                    s.temperament(),
                    "yes".equals(s.pettingPolicy()),
                    s.campusFrequency());
            dog.setLastSeenLocation(s.latitude(), s.longitude());
            dog.inputAppearance(s.furColor(), s.location(), s.about(), s.pettingPolicy());
            dog.setPhotoUrls(s.photoUrls());
            dog.setAddedBy(s.addedBy());
            for (int i = 0; i < s.likes(); i++) {
                dog.addLike();
            }
            catalog.createDogProfile(dog);
        }

        log.info("Seeded {} sample dogs.", SAMPLES.size());
    }
}
