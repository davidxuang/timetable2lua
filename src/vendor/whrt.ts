import { assert, attachButton, FlexTimetable, luaifyTimetable } from '../common.js';

function parseCell(cell: HTMLElement) {
  return cell.innerText.trim().replace(/——|[（(]到达[）)]/u, '');
}

const WHRT = {
  bootstrap: () => {
    const title = document.querySelector('h1');

    const copyData = function () {
      const timetable = new Map() as FlexTimetable;
      const tables = document.querySelectorAll<HTMLTableElement>('table.Table');
      tables.forEach((table) => {
        const termini = [
          ...table.querySelector('tr:has(td + td)')!.querySelectorAll('td'),
        ];
        const sub_termini = [
          ...table
            .querySelector('tr:not(:has(td[colspan]))')!
            .querySelectorAll('td'),
        ];
        assert(termini.length == 2, 'Invalid # of termini.');

        const terminiSpans = termini.map((td) => td.colSpan);
        assert(terminiSpans[0] >= 3, 'Invalid termini span.');
        assert(terminiSpans[1] >= 3, 'Invalid termini span.');

        const offsetFirst = [
          sub_termini
            .slice(0, terminiSpans[0])
            .find((td) => td.innerText.trim().startsWith('首班车'))!.cellIndex,
          sub_termini.find((td) => td.innerText.trim().startsWith('首班车'))!
            .cellIndex,
        ];
        const offsetLast = [
          sub_termini
            .slice(terminiSpans[0])
            .filter((td) => td.innerText.trim().startsWith('末班车'))
            .map((td) => td.cellIndex)
            .trySingle(),
          sub_termini
            .slice(0, terminiSpans[0])
            .filter((td) => td.innerText.trim().startsWith('末班车'))
            .map((td) => td.cellIndex)
            .trySingle(),
        ];

        // PATCH: 假定全程被置于最后，将全程提前
        offsetLast.forEach((o) => {
          if (o instanceof Array) {
            o.unshift(o.pop()!);
          }
        });

        const nameOffset = sub_termini
          .slice(terminiSpans[0])
          .find((td) => td.innerText.trim().startsWith('车站'))!.cellIndex;
        assert(nameOffset > 0, 'Invalid name offset.');

        const rows = [
          ...table.querySelectorAll<HTMLTableRowElement>(
            'tr:not(:has(td[colspan]))',
          ),
        ].slice(1);

        for (const row of rows) {
          const name = row.cells[nameOffset].innerText.trim();
          const up_row = rows[rows.length - 1 - rows.indexOf(row)];
          assert(up_row !== undefined, 'Invalid row.');

          if (!timetable.has(name)) {
            timetable.set(name, []);
          }
          timetable.get(name)!.push([
            [
              parseCell(row.cells[offsetFirst[0]]),
              parseCell(up_row.cells[offsetFirst[1]]),
            ],
            [
              offsetLast[0] instanceof Array
                ? offsetLast[0].map((i) => parseCell(row.cells[i]))
                : parseCell(row.cells[offsetLast[0]]),
              offsetLast[1] instanceof Array
                ? offsetLast[1].map((i) => parseCell(up_row.cells[i]))
                : parseCell(up_row.cells[offsetLast[1]]),
            ],
          ]);
        }
      });

      navigator.clipboard.writeText(luaifyTimetable(timetable));
    };

    attachButton(title, copyData);
  },
};

export default WHRT;
