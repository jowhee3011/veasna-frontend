import LoadingSpinner from "./LoadingSpinner";

export default function Loading() {
  return <LoadingSpinner fullscreen={false} message="Fetching records…" />;
}
