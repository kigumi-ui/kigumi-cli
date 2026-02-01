import { Card } from '@/components/ui/Card/Card';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Icon } from '@/components/ui/Icon/Icon';
import { Button } from '@/components/ui/Button/Button';

export function DeckSelectionExample() {
  const decks = [
    {
      name: 'Vigilance',
      description: 'Protect, defend, and restore as you ready heavy-hitters.',
      color: 'var(--wa-color-blue-60)',
      bgColor: 'var(--wa-color-blue-95)',
      icon: 'shield',
    },
    {
      name: 'Command',
      description: 'Build imposing armies and stockpile resources.',
      color: 'var(--wa-color-green-60)',
      bgColor: 'var(--wa-color-green-95)',
      icon: 'chevrons-up',
    },
    {
      name: 'Aggression',
      description:
        'Relentlessly deal damage and apply pressure to your opponent.',
      color: 'var(--wa-color-red-60)',
      bgColor: 'var(--wa-color-red-95)',
      icon: 'explosion',
    },
    {
      name: 'Cunning',
      description: 'Disrupt and frustrate your opponent with dastardly tricks.',
      color: 'var(--wa-color-yellow-60)',
      bgColor: 'var(--wa-color-yellow-95)',
      icon: 'moon-stars',
    },
  ];

  return (
    <Card appearance="outlined">
      {/* Header */}
      <div slot="header" className="wa-split:row wa-align-items-center">
        <h3 className="wa-heading-m" style={{ margin: 0 }}>
          Decks
        </h3>
        <Button appearance="plain" size="small">
          <Icon name="plus" />
        </Button>
      </div>

      {/* Body */}
      <div className="wa-stack wa-gap-xl">
        <p
          className="wa-body-s"
          style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
        >
          You haven't created any decks yet. Get started by selecting an aspect
          that matches your play style.
        </p>

        {/* Deck Grid */}
        <div
          className="wa-grid"
          style={{ '--min-column-size': '30ch' } as React.CSSProperties}
        >
          {decks.map((deck) => (
            <div key={deck.name} className="wa-flank wa-align-items-center">
              <Avatar
                shape="rounded"
                style={{
                  backgroundColor: deck.bgColor,
                  color: deck.color,
                }}
              >
                <Icon name={deck.icon} />
              </Avatar>
              <div className="wa-stack wa-gap-2xs">
                <h4 className="wa-heading-s" style={{ margin: 0 }}>
                  {deck.name}
                </h4>
                <p
                  className="wa-caption-s"
                  style={{ margin: 0, color: 'var(--wa-color-neutral-60)' }}
                >
                  {deck.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div slot="footer">
        <Button appearance="outlined" style={{ width: '100%' }}>
          <Icon name="dice-d20" />
          Roll for Initiative and a Deck!
        </Button>
      </div>
    </Card>
  );
}
