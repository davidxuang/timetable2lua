import {
  assert,
  attachButton,
  FlexTimePerDay,
  FlexTimetable,
  Timetable,
} from '../common.js';

function parseCell(cell: HTMLElement, closed: boolean) {
  return cell.innerText
    .trim()
    .replace(/\p{Pd}+/u, closed ? 'nil' : '')
    .replace(/^0([4-9]):(\d\d)$/, '$1:$2'); // trim leading zero for first trains;
}

function parseRow(
  cells: HTMLElement[],
  days: number[],
  first: number[],
  last: (number | number[])[],
): FlexTimePerDay[] {
  const closed =
    cells.slice(1).filter((cell) => cell.innerText.trim().length > 2).length ==
    0;

  return days.map((dayOffset) => [
    first.map((i) => parseCell(cells[i + dayOffset], closed)),
    last.map((index) =>
      index instanceof Array
        ? index.map((i) => parseCell(cells[i + dayOffset], closed))
        : parseCell(cells[index + dayOffset], closed),
    ),
  ]);
}

function parseRows(
  rows: HTMLElement[][],
  days: number[],
  first: number[],
  last: (number | number[])[],
) {
  const timetable = new Map() as FlexTimetable;
  for (const row of rows) {
    if (row.length == 0) {
      break;
    }
    const name = row[0].innerText.trim().replace('航站楼', '');
    if (!name || name == '--') {
      break;
    }

    timetable.set(name, parseRow(row, days, first, last));
  }
  return timetable;
}

const CRT = {
  bootstrap: function () {
    document.querySelectorAll<HTMLElement>('.schedule-card').forEach((card) => {
      const caption = [
        ...card.querySelectorAll<HTMLElement>('.schedule-card-head'),
      ].single();

      const copyData = function () {
        const table = [...card.querySelectorAll('table')].single();
        const [thDays, thTimes, thTermini] = (() => {
          const rows = table.tHead?.rows;
          if (rows?.length == 3) {
            return [0, 1, 2].map((r) =>
              [
                ...table.tHead!.rows[r].querySelectorAll<HTMLTableCellElement>(
                  'th:not([rowspan])',
                ),
              ].filter((th) => th.innerText.trim().length > 2),
            );
          } else if (rows?.length == 2) {
            function getCommon(left: string, right: string) {
              return left
                .split('')
                .filter((char, c) => char == right[c])
                .join('');
            }
            let days: HTMLTableCellElement[];
            if (rows[0].cells.length == 1 + 4) {
              days = [
                document.createElement('th'),
                document.createElement('th'),
              ];
              days[0].innerText = getCommon(
                rows[0].cells[1].innerText.trim(),
                rows[0].cells[2].innerText.trim(),
              );
              days[1].innerText = getCommon(
                rows[0].cells[3].innerText.trim(),
                rows[0].cells[4].innerText.trim(),
              );
              days.forEach((th) =>
                th.setAttribute(
                  'colspan',
                  (rows[0].cells[1].colSpan * 2).toString(),
                ),
              );
            } else {
              throw rows[0].cells;
            }
            return [
              days,
              ...[0, 1].map((r) =>
                [
                  ...table.tHead!.rows[
                    r
                  ].querySelectorAll<HTMLTableCellElement>('th:not([rowspan])'),
                ].filter((th) => th.innerText.trim().length > 2),
              ),
            ];
          } else {
            throw rows?.[0]?.cells;
          }
        })();

        if (thDays.length == 0) {
          thDays.push(document.createElement('th'));
          thDays[0].colSpan = thTimes
            .map((g) => g.colSpan)
            .reduce((p, c) => p + c, 0);
        }

        assert([1, 2].includes(thDays.length), 'Invalid # of days.');
        assert(
          thTimes.length % thDays.length == 0 && thTimes.length >= 2,
          'Invalid # of termini.',
        );
        assert(
          thTermini.length % thDays.length == 0 && thTermini.length >= 2,
          'Invalid # of child termini.',
        );

        const dayWidth = thDays[0].colSpan;

        const days = [];
        for (let i = 0; i < thDays.length; i++) {
          assert(thDays[i].colSpan == dayWidth);
          days.push(i * dayWidth);
        }

        const first = [1, 2];
        const last: (number | number[])[] = [3, 4];

        const dl = [];
        const ul = [];

        if (
          thTimes.length / thDays.length == 2 &&
          thTermini.length / thTimes.length == 2
        ) {
          // fix column order
          if (
            thTermini[0].innerText
              .trim()
              .includes(table.tBodies[0].rows[0].cells[0].innerText.trim())
          ) {
            first.reverse();
            last.reverse();
          }
        } else if (thTimes.length / thDays.length >= 2) {
          let i = 0;
          for (const terminus of thTimes) {
            const span = thTermini.slice(i, i + terminus.colSpan);
            if (terminus.innerText.trim().startsWith('首班车')) {
              first[0] =
                span.single((td) => {
                  const text = td.innerText.trim();
                  return text.match(/↓|内环/u) !== null;
                }).cellIndex + 1;
              first[1] =
                span.single((td) => {
                  const text = td.innerText.trim();
                  return text.match(/↑|外环/u) !== null;
                }).cellIndex + 1;
            } else {
              dl.push(
                ...span
                  .filter((td) => {
                    const text = td.innerText.trim();
                    return text.match(/↓|内环/u) !== null;
                  })
                  .map((td) => td.cellIndex + 1),
              );
              ul.push(
                ...span
                  .filter((td) => {
                    const text = td.innerText.trim();
                    return text.match(/↑|外环/u) !== null;
                  })
                  .map((td) => td.cellIndex + 1),
              );
            }

            i += terminus.colSpan;
            if (i >= thDays[0].colSpan) {
              break;
            }
          }

          [last[0], last[1]] =
            dl.length == 1 && ul.length == 1 ? [dl[0], ul[0]] : [dl, ul];
        } else {
          throw thTimes.length;
        }

        const rows = [...table.tBodies[0].rows].map((row) => [...row.cells]);
        let timetable = parseRows(rows, days, first, last);

        if (
          caption.innerText.includes('璧铜') &&
          timetable.keys().next().value?.includes('璧山')
        ) {
          timetable = Timetable.reverse(timetable);
        }

        navigator.clipboard.writeText(Timetable.luaify(timetable));
      };
      attachButton(caption, copyData);

      new MutationObserver(() => {
        if (caption.querySelector('a') == null) {
          attachButton(caption, copyData);

          // handle branch data at the tail
          const table = [...card.querySelectorAll('table')].single();
          const rows = [...table.tBodies[0].rows].map((row) => [...row.cells]);
          const i = rows.findIndex((row) =>
            row.every((cell) => cell.innerText.trim().length <= 2),
          );
          if (i < 0) return;
          const j = rows.findIndex(
            (row, r) =>
              r > i && row.some((cell) => cell.innerText.includes('↓')),
          );
          if (j < 0) return;
          attachButton(rows[j][0], function () {
            const d = rows[j]
              .map((cell, c) => (cell.innerText.includes('↓') ? c : null))
              .filter((c) => c !== null);
            const u = rows[j]
              .map((cell, c) => (cell.innerText.includes('↑') ? c : null))
              .filter((c) => c !== null);

            let days: number[];
            assert(
              d.length == u.length && d.length >= 2,
              'Invalid # of termini.',
            );
            const first = [d[0], u[0]];
            const last = [d[1], u[1]];
            if (d.length == 2) {
              days = [d[0] - 1];
            } else if (d.length == 4) {
              days = [d[0] - 1, d[2] - 1];
            } else {
              throw [d, u];
            }

            const timetable = parseRows(rows.slice(i + 2), days, first, last);

            navigator.clipboard.writeText(Timetable.luaify(timetable));
          });
        }
      }).observe(card, { childList: true, subtree: true });
    });
  },
};

export default CRT;
