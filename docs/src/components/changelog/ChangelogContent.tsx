import ReactMarkdown from 'react-markdown';
import changelog from '../../../../CHANGELOG.md?raw';
import './ChangelogContent.css';

export function ChangelogContent() {
  return (
    <div className="changelog-content">
      <h1 className="wa-heading-2xl" id="changelog">
        Changelog
      </h1>
      <ReactMarkdown>{changelog.replace(/^[\s\S]*?(?=## )/, '')}</ReactMarkdown>
    </div>
  );
}
