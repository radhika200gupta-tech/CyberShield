import { FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import Logo from '../common/Logo';

const FOOTER_LINKS = {
  Product: ['Features', 'Security Score', 'Pricing', 'Changelog'],
  Company: ['About', 'Careers', 'Blog', 'Contact'],
  Resources: ['Documentation', 'API Reference', 'Support', 'Status'],
  Legal: ['Privacy Policy', 'Terms of Service', 'Security'],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Logo />
            <p className="text-sm text-text-muted mt-4 max-w-xs">
              AI-powered protection for phishing, passwords, and suspicious links — built for teams that move fast.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[FiGithub, FiTwitter, FiLinkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social link"
                  className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-sm font-medium text-text-primary mb-3.5">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-muted">© 2026 CyberShield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
