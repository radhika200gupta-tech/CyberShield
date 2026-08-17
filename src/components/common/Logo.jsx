import { FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function Logo({ to = ROUTES.HOME, size = 'md' }) {
  const iconBox = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <span className={`relative flex items-center justify-center ${iconBox} rounded-lg bg-gradient-to-br from-primary to-accent`}>
        <FiShield className="text-white" size={size === 'sm' ? 15 : 18} />
      </span>
      <span className={`font-display font-semibold text-text-primary ${textSize}`}>
        CyberShield <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}
