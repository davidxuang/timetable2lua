import {
  assert,
  attachButton,
  FlexTimePerDay,
  FlexTimetable,
  luaifyTimetable,
} from '../common.js';

function parseCell(cell: HTMLElement, closed: boolean) {
  return cell.innerText
    .trim()
    .replace('--', closed ? 'nil' : '')
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

const CRT = {
  bootstrap: function () {
    document
      .querySelectorAll<HTMLTableElement>('.line-time-table')
      .forEach((table) => {
        const caption = table.querySelector('caption');

        const copyData = function () {
          const [days, termini, sub_termini] = [0, 1, 2].map((r) =>
            [
              ...table.tHead!.rows[r].querySelectorAll<HTMLTableCellElement>(
                '.bg-f7f7f7',
              ),
            ].filter((th) => th.innerText.trim().length > 2),
          );

          if (days.length == 0) {
            days.push(document.createElement('th'));
            days[0].colSpan = termini
              .map((g) => g.colSpan)
              .reduce((p, c) => p + c, 0);
          }

          assert([1, 2].includes(days.length), 'Invalid # of days.');
          assert(
            termini.length % days.length == 0 && termini.length >= 2,
            'Invalid # of termini.',
          );
          assert(
            sub_termini.length % days.length == 0 && sub_termini.length >= 2,
            'Invalid # of child termini.',
          );

          const dayWidth = days[0].colSpan;

          const dayOffsets = [];
          for (let i = 0; i < days.length; i++) {
            assert(days[i].colSpan == dayWidth);
            dayOffsets.push(i * dayWidth);
          }

          const offsetFirst = [1, 2];
          const offsetLast: (number | number[])[] = [3, 4];

          if (
            termini.length / days.length == 2 &&
            sub_termini.length / termini.length == 2
          ) {
            // no op
          } else if (termini.length / days.length >= 2) {
            offsetLast[0] = [];
            offsetLast[1] = [];

            let i = 0;
            for (const terminus of termini) {
              const span = sub_termini.slice(i, i + terminus.colSpan);
              if (terminus.innerText.trim().startsWith('首班车')) {
                offsetFirst[0] =
                  span.single((td) => {
                    const text = td.innerText.trim();
                    return text.includes('↓') || text.includes('内环');
                  }).cellIndex + 1;
                offsetFirst[1] =
                  span.single((td) => {
                    const text = td.innerText.trim();
                    return text.includes('↑') || text.includes('外环');
                  }).cellIndex + 1;
              } else {
                offsetLast[0] = span
                  .filter((td) => {
                    const text = td.innerText.trim();
                    return text.includes('↓') || text.includes('内环');
                  })
                  .map((td) => td.cellIndex + 1)
                  .trySingle();
                offsetLast[1] = span
                  .filter((td) => {
                    const text = td.innerText.trim();
                    return text.includes('↑') || text.includes('外环');
                  })
                  .map((td) => td.cellIndex + 1)
                  .trySingle();
              }

              i += terminus.colSpan;
              if (i >= days[0].colSpan) {
                break;
              }
            }
          } else {
            throw termini.length;
          }

          const rows = [...table.tBodies[0].rows].map((row) => [...row.cells]);
          const timetable = new Map() as FlexTimetable;

          for (const row of rows) {
            if (row.length == 0) {
              break;
            }
            const name = row[0].innerText.trim().replace('航站楼', '');
            if (!name || name == '--') {
              break;
            }

            timetable.set(
              name,
              parseRow(row, dayOffsets, offsetFirst, offsetLast),
            );
          }

          navigator.clipboard.writeText(luaifyTimetable(timetable));
        };

        attachButton(caption, copyData);
      });
  },
};

export default CRT;
