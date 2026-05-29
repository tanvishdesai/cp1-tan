import { useAuth } from '../context/AuthContext.jsx';

function timeOfDay(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// Personalized greeting: time-of-day + login streak (PLANNING §5 / Milestone 5).
export default function GreetingBanner() {
  const { user } = useAuth();
  if (!user) return null;

  const greeting = timeOfDay(new Date().getHours());
  const streak = user.login_streak ?? 0;
  const first = user.name.split(' ')[0];

  return (
    <div className="greeting">
      <span>
        {greeting}, {first}.
      </span>
      {streak > 1 && (
        <span className="streak">🔥 {streak}-day streak — keep it going!</span>
      )}
    </div>
  );
}
