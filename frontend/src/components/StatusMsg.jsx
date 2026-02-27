/**
 * StatusMsg — displays info / success / error feedback messages.
 */
export default function StatusMsg({ text, type }) {
  if (!text) return null;

  return (
    <div className={`msg msg--show msg--${type}`}>
      {text}
    </div>
  );
}
