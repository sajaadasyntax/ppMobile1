import { Slot } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import ErrorBoundary from "../components/ErrorBoundary";

// Optional: Log errors to an external service in production
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  // You could send this to an error tracking service like Sentry
  console.error('Global error caught:', error.message);
  // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
};

export default function Layout() {
  return (
    <ErrorBoundary onError={handleGlobalError}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </ErrorBoundary>
  );
}