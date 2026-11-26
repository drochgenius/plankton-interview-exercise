import { useState } from 'react';
import type { Scoreboard as ScoreboardData } from 'shared-types';
import { Button } from './Button';
import styles from './Scoreboard.module.scss';

type BoardName = keyof ScoreboardData;

const TITLES: Record<BoardName, string> = {
  passed: 'Passing scoreboard',
  failed: 'Failed scoreboard',
};

interface ScoreboardProps {
  data: ScoreboardData;
  /** The board that matches the player's result. */
  startOn: BoardName;
  /** The player's own submission. Its row is highlighted. */
  yourId: string;
}

export function Scoreboard({ data, startOn, yourId }: ScoreboardProps) {
  const [board, setBoard] = useState<BoardName>(startOn);
  const other: BoardName = board === 'passed' ? 'failed' : 'passed';
  const rows = data[board];

  return (
    <section className={styles.board} aria-labelledby="scoreboard-title">
      <div className={styles.header}>
        <h2 id="scoreboard-title">{TITLES[board]}</h2>
        <Button onClick={() => setBoard(other)}>Switch Scoreboard</Button>
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>No scores on this board yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isYou = row.id === yourId;
                return (
                  <tr key={row.id} className={isYou ? styles.you : undefined}>
                    <td>
                      {row.participantName}
                      {isYou && <span className={styles.youLabel}> (you)</span>}
                    </td>
                    <td>
                      {row.score} / {row.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
