import { Redirect } from 'expo-router';

export default function DocumentsIndex() {
  // Redirect to archive since documents are accessed from there
  return <Redirect href="/archive" />;
}
