import { FiCheck, FiAlertTriangle } from 'react-icons/fi';

export default function SecurityFindings({ findings }) {
  return (
    <div>
      <span className="stage-eyebrow">What we found</span>
      <ul className="mt-3 space-y-2">
        {findings.map((finding, i) => {
          const ok = finding.status === 'ok';
          return (
            <li
              key={`${finding.text}-${i}`}
              className="flex items-start gap-2.5 text-sm"
            >
              <span
                className={
                  ok
                    ? 'mt-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-success/15 text-success shrink-0'
                    : 'mt-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-warning/15 text-warning shrink-0'
                }
              >
                {ok ? <FiCheck size={10} /> : <FiAlertTriangle size={10} />}
              </span>
              <span className={ok ? 'text-text-secondary' : 'text-text-primary'}>{finding.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
