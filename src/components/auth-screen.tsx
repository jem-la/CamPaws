import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Field, PrimaryButton, RED } from '@/components/form-field';
import { api } from '@/lib/api';
import { logIn, signUp } from '@/lib/auth-store';

type Mode = 'login' | 'signup' | 'forgot';

const FALLBACK_QUESTIONS = [
  'What is your favorite food at the SCU cafeteria?',
  'What is your favorite spot on the SCU campus?',
  'What was the name of your first-year residence hall at SCU?',
  'Which SCU class has been your favorite so far?',
];

/** Shown instead of the app while nobody is signed in. */
export function AuthScreen({ restoreError }: { restoreError?: string }) {
  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState<string | undefined>();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>🐾</Text>
          <Text style={styles.brand} accessibilityRole="header">
            CamPaws
          </Text>
          <Text style={styles.tagline}>Meet, photograph and walk the dogs of Santa Clara University.</Text>

          {message && <Text style={styles.success}>{message}</Text>}
          {restoreError && !message && <Text style={styles.error}>{restoreError}</Text>}

          {mode === 'login' && <LoginForm onSwitch={setMode} />}
          {mode === 'signup' && <SignUpForm onSwitch={setMode} />}
          {mode === 'forgot' && (
            <ForgotForm
              onSwitch={setMode}
              onDone={() => {
                setMessage('Password updated. Log in with your new password.');
                setMode('login');
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useSubmit(action: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const run = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run, setError };
}

function LoginForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { busy, error, run } = useSubmit(async () => {
    if (!email.trim() || !password) throw new Error('Enter your email and password.');
    await logIn(email, password);
  });

  return (
    <View style={styles.form}>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder="you@scu.edu" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" onSubmitEditing={run} placeholder="Your password" />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Log in" onPress={run} busy={busy} />
      <Pressable accessibilityRole="button" onPress={() => onSwitch('forgot')} hitSlop={8}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onSwitch('signup')} hitSlop={8}>
        <Text style={styles.switch}>
          New here? <Text style={styles.linkInline}>Create an account</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function QuestionPicker({ questions, value, onChange }: { questions: string[]; value: string; onChange: (q: string) => void }) {
  return (
    <View style={styles.pickerWrap}>
      <Text style={styles.pickerLabel}>Security question (used if you forget your password)</Text>
      {questions.map((q) => (
        <Pressable
          key={q}
          accessibilityRole="radio"
          accessibilityState={{ selected: q === value }}
          onPress={() => onChange(q)}
          style={[styles.choice, q === value && styles.choiceOn]}>
          <Text style={[styles.choiceText, q === value && styles.choiceTextOn]}>{q}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function SignUpForm({ onSwitch }: { onSwitch: (m: Mode) => void }) {
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [question, setQuestion] = useState(FALLBACK_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    api
      .securityQuestions()
      .then((list) => {
        if (list.length) {
          setQuestions(list);
          setQuestion(list[0]);
        }
      })
      .catch(() => undefined);
  }, []);

  const { busy, error, run } = useSubmit(async () => {
    if (!displayName.trim()) throw new Error('Enter your name.');
    if (!email.trim()) throw new Error('Enter your email.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (!answer.trim()) throw new Error('Answer your security question.');
    await signUp({ email: email.trim(), displayName: displayName.trim(), password, securityQuestion: question, securityAnswer: answer });
  });

  return (
    <View style={styles.form}>
      <Field label="Name" value={displayName} onChangeText={setDisplayName} textContentType="name" placeholder="Alex Lee" />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" placeholder="you@scu.edu" />
      <Field label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" placeholder="Choose a password" />
      <QuestionPicker questions={questions} value={question} onChange={setQuestion} />
      <Field label="Your answer" value={answer} onChangeText={setAnswer} autoCapitalize="none" placeholder="e.g. Pizza" onSubmitEditing={run} />
      {error && <Text style={styles.error}>{error}</Text>}
      <PrimaryButton label="Create account" onPress={run} busy={busy} />
      <Pressable accessibilityRole="button" onPress={() => onSwitch('login')} hitSlop={8}>
        <Text style={styles.switch}>
          Already have an account? <Text style={styles.linkInline}>Log in</Text>
        </Text>
      </Pressable>
    </View>
  );
}

function ForgotForm({ onSwitch, onDone }: { onSwitch: (m: Mode) => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState<string | undefined>();
  const [answer, setAnswer] = useState('');
  const [password, setPassword] = useState('');

  const step1 = useSubmit(async () => {
    if (!email.trim()) throw new Error('Enter the email you signed up with.');
    setQuestion((await api.resetQuestion(email.trim())).question);
  });
  const step2 = useSubmit(async () => {
    if (!answer.trim()) throw new Error('Enter your answer.');
    if (password.length < 8) throw new Error('New password must be at least 8 characters.');
    await api.resetPassword(email.trim(), answer, password);
    onDone();
  });

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Reset your password</Text>
      <Field label="Email" value={email} onChangeText={setEmail} editable={!question} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@scu.edu" />
      {!question ? (
        <>
          {step1.error && <Text style={styles.error}>{step1.error}</Text>}
          <PrimaryButton label="Continue" onPress={step1.run} busy={step1.busy} />
        </>
      ) : (
        <>
          <Text style={styles.question}>{question}</Text>
          <Field label="Your answer" value={answer} onChangeText={setAnswer} autoCapitalize="none" />
          <Field label="New password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" onSubmitEditing={step2.run} />
          {step2.error && <Text style={styles.error}>{step2.error}</Text>}
          <PrimaryButton label="Reset password" onPress={step2.run} busy={step2.busy} />
        </>
      )}
      <Pressable accessibilityRole="button" onPress={() => onSwitch('login')} hitSlop={8}>
        <Text style={styles.link}>Back to log in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  content: { padding: 24, maxWidth: 440, width: '100%', alignSelf: 'center', paddingBottom: 40 },
  logo: { fontSize: 44, textAlign: 'center', marginTop: 16 },
  brand: { fontSize: 30, fontWeight: '800', color: RED, textAlign: 'center', marginTop: 4 },
  tagline: { fontSize: 13, color: '#888188', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  form: { gap: 0 },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#28242b', marginBottom: 14 },
  error: { color: '#b3182d', fontSize: 13, marginBottom: 12 },
  success: { color: '#1f7a45', backgroundColor: '#eaf6ef', padding: 10, borderRadius: 10, fontSize: 13, marginBottom: 16, overflow: 'hidden' },
  link: { color: RED, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  linkInline: { color: RED, fontWeight: '700' },
  switch: { color: '#6f666d', fontSize: 13, textAlign: 'center', marginTop: 14 },
  pickerWrap: { marginBottom: 14, gap: 8 },
  pickerLabel: { fontSize: 12, fontWeight: '700', color: '#6f666d' },
  choice: { borderWidth: 1, borderColor: '#e7dfe1', borderRadius: 12, padding: 12 },
  choiceOn: { borderColor: RED, backgroundColor: '#fff0f1' },
  choiceText: { fontSize: 13, color: '#4a434a' },
  choiceTextOn: { color: RED, fontWeight: '700' },
  question: { fontSize: 15, fontWeight: '700', color: '#28242b', marginBottom: 12 },
});
