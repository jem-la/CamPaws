import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { RED } from '@/components/form-field';
import { api, type CommentDto } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { showAlert } from '@/lib/confirm';

const MAX_LENGTH = 500;

/** "3 min ago", "2 h ago", "4 days ago", or the date for older comments. */
function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString();
}

/** Comment list and box for one dog profile. */
export function DogComments({ dogId, onCountChange }: { dogId: string; onCountChange?: (count: number) => void }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentDto[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .comments(dogId)
      .then((list) => active && setComments(list))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [dogId]);

  useEffect(() => {
    if (comments) onCountChange?.(comments.length);
  }, [comments, onCountChange]);

  const post = async () => {
    const body = text.trim();
    if (!body) return;
    setPosting(true);
    try {
      const saved = await api.addComment(dogId, body);
      setComments((list) => [...(list ?? []), saved]);
      setText('');
    } catch (e) {
      showAlert('Couldn’t post comment', (e as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const remove = (c: CommentDto) =>
    showAlert('Delete comment?', c.body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          api
            .deleteComment(dogId, c.commentId)
            .then(() => setComments((list) => (list ?? []).filter((x) => x.commentId !== c.commentId)))
            .catch((e: Error) => showAlert('Couldn’t delete comment', e.message)),
      },
    ]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Comments{comments ? ` (${comments.length})` : ''}</Text>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !comments ? (
        <ActivityIndicator color={RED} style={styles.spinner} />
      ) : comments.length === 0 ? (
        <Text style={styles.muted}>No comments yet. Say hi!</Text>
      ) : (
        comments.map((c) => (
          <View key={c.commentId} style={styles.comment}>
            <View style={styles.commentHead}>
              <Text style={styles.author}>{c.authorName}</Text>
              <Text style={styles.time}>{timeAgo(c.createdAt)}</Text>
              {c.userId === user?.userId && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete your comment"
                  hitSlop={8}
                  onPress={() => remove(c)}
                  style={styles.delete}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.body}>{c.body}</Text>
          </View>
        ))
      )}

      <View style={styles.compose}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Write a comment"
          placeholderTextColor="#969095"
          multiline
          maxLength={MAX_LENGTH}
          accessibilityLabel="Write a comment"
        />
        <Pressable
          accessibilityRole="button"
          onPress={post}
          disabled={posting || !text.trim()}
          style={[styles.post, (posting || !text.trim()) && styles.postDisabled]}>
          {posting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.postText}>Post</Text>}
        </Pressable>
      </View>
      {text.length > MAX_LENGTH - 50 && (
        <Text style={styles.counter}>
          {text.length}/{MAX_LENGTH}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24, gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: '#28242b' },
  spinner: { marginVertical: 12 },
  error: { color: '#b3182d', fontSize: 13 },
  muted: { color: '#8b858b', fontSize: 13 },
  comment: { borderWidth: 1, borderColor: '#eee7e8', borderRadius: 12, padding: 12, gap: 4 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  author: { fontSize: 13, fontWeight: '700', color: '#2d272d' },
  time: { fontSize: 11, color: '#9b949a', flex: 1 },
  delete: { paddingHorizontal: 4 },
  deleteText: { fontSize: 12, color: RED, fontWeight: '600' },
  body: { fontSize: 14, color: '#4a444a', lineHeight: 20 },
  compose: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#eee7e8',
    backgroundColor: '#fcfafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: '#2c292d',
  },
  post: { height: 44, minWidth: 64, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  postDisabled: { opacity: 0.5 },
  postText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  counter: { fontSize: 11, color: '#9b949a', textAlign: 'right' },
});
