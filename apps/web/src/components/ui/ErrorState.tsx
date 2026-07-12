import { Alert } from "./Alert";

type ErrorStateProps = {
  title: string;
  message: string;
};

export function ErrorState({ title, message }: ErrorStateProps) {
  return <Alert message={message} title={title} variant="danger" />;
}
