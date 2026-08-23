// WebsiteCard.jsx
// Displays a simulated browser window mockup for one website (Option A or Option B).
// When clicked, it calls the onSelect function passed down from the parent component.

export default function WebsiteCard(props) {
  // Determine if this URL uses secure HTTPS or unsecure HTTP
  let isHttps = false;
  if (props.website && props.website.url) {
    isHttps = props.website.url.startsWith("https://");
  }

  // Determine card border and background classes based on state
  let cardClass = "bg-surface border-2 border-border rounded-xl overflow-hidden cursor-pointer transition-all flex flex-col hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/20";
  if (props.showResult) {
    if (props.isFakeWebsite) {
      cardClass = cardClass.replace('hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/20', '') + " border-danger bg-danger/5";
    } else {
      cardClass = cardClass.replace('hover:-translate-y-1 hover:border-accent hover:shadow-lg hover:shadow-accent/20', '') + " border-success bg-success/5";
    }

    if (props.isSelected) {
      cardClass = cardClass + " ring-2 ring-accent/60";
    }
  } else if (props.isSelected) {
    cardClass = cardClass + " border-primary ring-2 ring-primary/40";
  }

  // Handle click on this website card
  function handleClick() {
    if (!props.disabled && props.onSelect) {
      props.onSelect(props.label);
    }
  }

  const content = props.website ? props.website.content : null;

  return (
    <div
      className={cardClass}
      onClick={handleClick}
      role="button"
      tabIndex={props.disabled ? -1 : 0}
    >
      {/* Top bar of the simulated browser window */}
      <div className="bg-bg-elevated border-b border-border py-2.5 px-3.5 flex items-center gap-2.5">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
        </div>

        <div className="flex-1 bg-surface border border-border rounded-md py-1 px-2 flex items-center gap-1.5 min-w-0">
          <span className="text-xs">
            {isHttps ? "🔒" : "⚠️"}
          </span>
          <span className="font-mono text-xs text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
            {props.website ? props.website.url : ""}
          </span>
        </div>

        <span className="text-[0.7rem] font-bold bg-border text-text-secondary py-0.5 px-2 rounded tracking-wider whitespace-nowrap">
          Option {props.label}
        </span>
      </div>

      {/* Mockup content of the webpage */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        {content ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-text-primary">{content.companyName}</span>
              <span className="text-[0.7rem] bg-white/5 border border-border py-0.5 px-2 rounded text-text-secondary">{content.badge}</span>
            </div>

            <h3 className="text-[1.05rem] font-semibold text-text-primary leading-tight">{content.title}</h3>
            <p className="text-[0.8rem] text-text-secondary leading-snug">{content.subtitle}</p>

            <div className="mt-2 flex flex-col gap-2">
              <div className="bg-bg-elevated border border-border rounded-md py-2 px-3">
                <span className="font-mono text-xs text-text-muted">user@example.com</span>
              </div>
              <button type="button" className="bg-primary text-white font-semibold text-[0.8rem] py-2 px-4 rounded-md text-center cursor-default pointer-events-none opacity-90">
                {content.buttonText}
              </button>
            </div>

            <p className="text-[0.72rem] text-text-muted mt-1.5 leading-snug">{content.notice}</p>
          </div>
        ) : null}

        {/* Revealed verdict badge shown after user clicks an answer */}
        {props.showResult ? (
          <div className="mt-4 pt-3 border-t border-border text-center">
            {props.isFakeWebsite ? (
              <span className="inline-block text-[0.8rem] font-bold text-danger bg-danger/10 border border-danger/30 py-1 px-3 rounded-full">
                ⚠️ PHISHING SITE (Fake)
              </span>
            ) : (
              <span className="inline-block text-[0.8rem] font-bold text-success bg-success/10 border border-success/30 py-1 px-3 rounded-full">
                🛡️ LEGITIMATE SITE (Real)
              </span>
            )}
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-dashed border-border text-center">
            <span className="text-xs text-accent font-medium">Click to choose this as the FAKE site</span>
          </div>
        )}
      </div>
    </div>
  );
}

