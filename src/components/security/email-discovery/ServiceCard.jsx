import { useState } from 'react';
import { 
  FiExternalLink, FiChevronDown, FiChevronUp, 
  FiCheckCircle, FiHelpCircle, FiSlash, FiAtSign, FiCornerDownRight 
} from 'react-icons/fi';
import { 
  FaGithub, FaLinkedin, FaMicrosoft, FaGoogle, FaSpotify, FaKey 
} from 'react-icons/fa';
import { SiGravatar } from 'react-icons/si';

/**
 * Maps service IDs to official brand logos and colors
 */
function getBrandInfo(serviceId) {
  switch (serviceId?.toLowerCase()) {
    case 'gravatar':
      return {
        icon: SiGravatar,
        color: 'text-[#1e8cbe]',
        bgColor: 'bg-[#1e8cbe]/10 border-[#1e8cbe]/30',
        officialUrl: 'https://gravatar.com'
      };
    case 'openpgp':
      return {
        icon: FaKey,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        officialUrl: 'https://keys.openpgp.org'
      };
    case 'github':
      return {
        icon: FaGithub,
        color: 'text-text-primary',
        bgColor: 'bg-white/5 border-white/20',
        officialUrl: 'https://github.com'
      };
    case 'email-structure':
      return {
        icon: FiAtSign,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10 border-indigo-500/30',
        officialUrl: null
      };
    case 'google':
    case 'google-workspace':
      return {
        icon: FaGoogle,
        color: 'text-[#EA4335]',
        bgColor: 'bg-[#EA4335]/10 border-[#EA4335]/30',
        officialUrl: 'https://workspace.google.com'
      };
    case 'microsoft':
    case 'microsoft-365':
      return {
        icon: FaMicrosoft,
        color: 'text-[#00A4EF]',
        bgColor: 'bg-[#00A4EF]/10 border-[#00A4EF]/30',
        officialUrl: 'https://www.microsoft.com/microsoft-365'
      };
    case 'linkedin':
      return {
        icon: FaLinkedin,
        color: 'text-[#0A66C2]',
        bgColor: 'bg-[#0A66C2]/10 border-[#0A66C2]/30',
        officialUrl: 'https://www.linkedin.com'
      };
    case 'spotify':
      return {
        icon: FaSpotify,
        color: 'text-[#1DB954]',
        bgColor: 'bg-[#1DB954]/10 border-[#1DB954]/30',
        officialUrl: 'https://www.spotify.com'
      };
    default:
      return {
        icon: FaKey,
        color: 'text-accent',
        bgColor: 'bg-accent/10 border-accent/30',
        officialUrl: null
      };
  }
}

/**
 * Simple, understandable status labels per Requirement 4.B:
 * - Found
 * - Not found
 * - Unavailable
 * - Not checked
 */
function getSimpleStatus(status) {
  switch (status) {
    case 'CONFIRMED':
      return {
        label: 'Found',
        subLabel: 'Verified Record',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        cardBorder: 'border-border/80 hover:border-emerald-500/40',
        icon: FiCheckCircle
      };
    case 'POSSIBLE_MATCH':
      return {
        label: 'Found',
        subLabel: 'Possible Match',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        cardBorder: 'border-border/80 hover:border-amber-500/40',
        icon: FiCheckCircle
      };
    case 'NO_MATCH':
      return {
        label: 'Not found',
        subLabel: 'No Public Match',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        cardBorder: 'border-border/60 hover:border-border',
        icon: FiHelpCircle
      };
    case 'UNAVAILABLE':
      return {
        label: 'Unavailable',
        subLabel: 'Restricted by Policy',
        badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
        cardBorder: 'border-border/50 hover:border-border',
        icon: FiSlash
      };
    case 'UNKNOWN':
    case 'INCONCLUSIVE':
    default:
      return {
        label: 'Not checked',
        subLabel: 'Inconclusive',
        badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
        cardBorder: 'border-border/60 hover:border-border',
        icon: FiHelpCircle
      };
  }
}

/**
 * Maps result verification source types to clean labels
 */
function getSourceBadge(sourceType) {
  switch (sourceType) {
    case 'live_api':
      return {
        label: 'Live API result',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    case 'local_analysis':
      return {
        label: 'Local analysis',
        badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30'
      };
    case 'demo':
      return {
        label: 'Demo result',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      };
    case 'unavailable':
    default:
      return {
        label: 'Unavailable',
        badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
      };
  }
}

/**
 * Generate actionable "What can the user do next?" guidance (Requirement 4.B)
 */
function getNextActionAdvice(service) {
  const status = service.status;
  const id = service.id;

  if (status === 'CONFIRMED' || status === 'POSSIBLE_MATCH') {
    if (id === 'openpgp') {
      return 'Import the public cryptographic key to encrypt sensitive emails to this sender.';
    }
    if (id === 'gravatar' || id === 'github') {
      return 'Cross-reference username and avatar with other communications to confirm identity.';
    }
    if (id === 'google' || id === 'microsoft') {
      return 'Verify that mail routing hops in headers align with this provider.';
    }
    if (id === 'email-structure') {
      return 'Check whether subaddress aliases match any known organizational tracking patterns.';
    }
    return 'Inspect the public source profile to confirm relevance to the ongoing investigation.';
  }

  if (status === 'NO_MATCH') {
    if (id === 'openpgp') {
      return 'Send messages via standard TLS or request a public key directly from the sender.';
    }
    return 'Note that absence of a public record does not prove the user has no account on this service.';
  }

  if (status === 'UNAVAILABLE') {
    return 'Platform defenses restrict unauthenticated checks. Verify sender identity through out-of-band channels.';
  }

  return 'Review sender header metadata or re-run discovery with secondary email aliases.';
}

export default function ServiceCard({ service }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!service) return null;

  const brand = getBrandInfo(service.id);
  const BrandIcon = brand.icon;
  const statusInfo = getSimpleStatus(service.status);
  const StatusIcon = statusInfo.icon;
  const sourceInfo = getSourceBadge(service.sourceType || (service.status === 'UNAVAILABLE' ? 'unavailable' : 'local_analysis'));
  const nextStepAdvice = getNextActionAdvice(service);

  // Determine external URL and action button label
  let actionUrl = null;
  let actionLabel = 'Open Service';

  if (service.status === 'CONFIRMED' && service.profileUrl) {
    actionUrl = service.profileUrl;
    actionLabel = 'View Source';
  } else if (service.profileUrl) {
    actionUrl = service.profileUrl;
    actionLabel = 'Open Service';
  } else if (brand.officialUrl) {
    actionUrl = brand.officialUrl;
    actionLabel = 'Open Service';
  }

  return (
    <div className={`p-4 sm:p-5 rounded-xl border bg-bg-surface transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md ${statusInfo.cardBorder}`}>
      
      {/* 1. What was checked? (Service Icon, Name, Category, Status Badge) */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Brand Logo */}
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${brand.bgColor} ${brand.color}`}>
              <BrandIcon size={18} />
            </div>

            <div className="min-w-0">
              <h4 className="text-sm sm:text-base font-semibold text-text-primary truncate">
                {service.name}
              </h4>
              <p className="text-xs text-text-muted truncate">
                {service.category}
              </p>
            </div>
          </div>

          {/* Simple Understandable Status Label (Found / Not found / Unavailable) */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded border font-medium shrink-0 ${statusInfo.badgeClass}`}>
            <StatusIcon size={12} />
            <span>{statusInfo.label}</span>
          </span>
        </div>

        {/* 2. What does the result actually mean? */}
        <div className="text-sm text-text-secondary leading-relaxed">
          <p>{service.explanation}</p>
          {service.status === 'NO_MATCH' && (
            <p className="text-xs text-text-muted italic mt-1.5">
              Note: &ldquo;Not found&rdquo; does not prove an account does not exist.
            </p>
          )}
        </div>

        {/* 3. What can the user do next? */}
        <div className="pt-2.5 border-t border-border/40 text-xs sm:text-sm text-text-secondary flex items-start gap-1.5 leading-relaxed">
          <FiCornerDownRight className="text-accent shrink-0 mt-0.5" size={13} />
          <span><strong className="text-text-primary font-medium">Next:</strong> {nextStepAdvice}</span>
        </div>
      </div>

      {/* 4. Expandable View Details Section (Requirement 4.C) */}
      {showDetails && (
        <div className="my-3 pt-3 border-t border-border/50 text-xs sm:text-sm space-y-2.5 animate-fade-in bg-bg-elevated/40 p-3 rounded-lg border border-border/40">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`px-2 py-0.5 rounded border ${sourceInfo.badgeClass}`}>
              {sourceInfo.label}
            </span>
            {service.timestamp && (
              <span className="text-text-muted">
                {service.timestamp}
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
              Technical Evidence:
            </span>
            <div className="font-mono text-xs sm:text-sm text-text-primary bg-bg-surface p-2.5 rounded border border-border/40 break-all leading-relaxed">
              {service.evidence}
            </div>
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
              Scope & Limitations:
            </span>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              {service.limitations}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Footer: View details control & Safe Action Button */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2 mt-3">
        {/* Toggle Details Button (Requirement 4.C) */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {showDetails ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          <span>{showDetails ? 'Hide details' : 'View details'}</span>
        </button>

        {/* Action Button: View Source or Open Service */}
        {actionUrl && (
          <a
            href={actionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-elevated border border-border hover:border-accent/40 text-xs text-text-secondary hover:text-accent transition-colors font-mono cursor-pointer"
            title={`${actionLabel}: ${service.name}`}
          >
            <span>{actionLabel}</span>
            <FiExternalLink size={11} />
          </a>
        )}
      </div>

    </div>
  );
}
