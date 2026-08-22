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
  let cardClass = "website-card";
  if (props.showResult) {
    if (props.isFakeWebsite) {
      cardClass = cardClass + " card-fake-revealed";
    } else {
      cardClass = cardClass + " card-real-revealed";
    }

    if (props.isSelected) {
      cardClass = cardClass + " card-user-selected";
    }
  } else if (props.isSelected) {
    cardClass = cardClass + " card-selected";
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
      <div className="browser-topbar">
        <div className="browser-dots">
          <span className="browser-dot dot-red" />
          <span className="browser-dot dot-yellow" />
          <span className="browser-dot dot-green" />
        </div>

        <div className="browser-address-bar">
          <span className="address-bar-icon">
            {isHttps ? "🔒" : "⚠️"}
          </span>
          <span className="address-bar-url">
            {props.website ? props.website.url : ""}
          </span>
        </div>

        <span className="option-badge">
          Option {props.label}
        </span>
      </div>

      {/* Mockup content of the webpage */}
      <div className="browser-body">
        {content ? (
          <div className="mockup-page">
            <div className="mockup-header">
              <span className="mockup-company">{content.companyName}</span>
              <span className="mockup-tag">{content.badge}</span>
            </div>

            <h3 className="mockup-title">{content.title}</h3>
            <p className="mockup-subtitle">{content.subtitle}</p>

            <div className="mockup-action-area">
              <div className="mockup-fake-input">
                <span className="fake-input-placeholder">user@example.com</span>
              </div>
              <button type="button" className="mockup-button" disabled>
                {content.buttonText}
              </button>
            </div>

            <p className="mockup-notice">{content.notice}</p>
          </div>
        ) : null}

        {/* Revealed verdict badge shown after user clicks an answer */}
        {props.showResult ? (
          <div className="verdict-banner">
            {props.isFakeWebsite ? (
              <span className="verdict-fake">
                ⚠️ PHISHING SITE (Fake)
              </span>
            ) : (
              <span className="verdict-real">
                🛡️ LEGITIMATE SITE (Real)
              </span>
            )}
          </div>
        ) : (
          <div className="click-to-choose-hint">
            <span className="hint-text">Click to choose this as the FAKE site</span>
          </div>
        )}
      </div>
    </div>
  );
}
