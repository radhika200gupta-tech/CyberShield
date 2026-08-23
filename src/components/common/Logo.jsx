import { FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

export default function Logo({ to = ROUTES.HOME, size = 'md', iconOnly = false }) {
  const iconBox = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <span className={`relative flex items-center justify-center shrink-0 ${iconBox} rounded-lg bg-gradient-to-br from-primary to-accent`}>
        <FiShield className="text-white" size={size === 'sm' ? 15 : 18} />
      </span>
      {!iconOnly && (
        <span className={`font-display font-semibold text-text-primary whitespace-nowrap ${textSize}`}>
          CyberShield
        </span>
      )}
    </Link>
  );
}
