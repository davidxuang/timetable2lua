import wcwidth from 'wcwidth';
import { assert, luaifyTimetable } from '../common';

type TerminalOffsets = [
  number | number[],
  number | number[],
  number | number[],
  number | number[],
];

function getItemsTextByIndex(
  items: HTMLElement[],
  terminalOffset: number | number[],
  dayOffset: number,
  closed: boolean,
) {
  if (terminalOffset instanceof Array) {
    return terminalOffset.map((index) =>
      items[index + dayOffset].innerHTML
        .trim()
        .replace('--', closed ? 'nil' : ''),
    );
  } else {
    return items[terminalOffset + dayOffset].innerHTML
      .trim()
      .replace('--', closed ? 'nil' : '');
  }
}

const CRT = {
  bootstrap: () => {
    document
      .querySelectorAll<HTMLTableElement>('.line-time-table')
      .forEach((table) => {
        let caption = table.querySelector('caption');

        let copyData = () => {
          let [days, termini, child_termini] = [0, 1, 2].map((r) =>
            (
              Array.from(
                table.tHead!.rows[r].querySelectorAll('.bg-f7f7f7'),
              ) as HTMLTableCellElement[]
            ).filter((th) => th.innerText.trim().length > 2),
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
            child_termini.length % days.length == 0 &&
              child_termini.length >= 2,
            'Invalid # of child termini.',
          );

          let dayWidth = days[0].colSpan;

          let dayOffsets = [];
          for (let i = 0; i < days.length; i++) {
            assert(days[i].colSpan == dayWidth);
            dayOffsets.push(i * dayWidth);
          }

          let terminalOffsets: TerminalOffsets = [1, 2, 3, 4];

          if (
            termini.length / days.length == 2 &&
            child_termini.length / termini.length == 2
          ) {
            // no op
          } else if (termini.length / days.length >= 2) {
            terminalOffsets = [[], [], [], []];
            let i = 0;
            let dayWidth = days[0].colSpan;
            for (var orientation of termini) {
              let orientationWidth = orientation.colSpan;
              if (orientation.innerHTML.trim().startsWith('首班车')) {
                for (let j = 0; j < orientationWidth; j++) {
                  let terminusText = child_termini[i + j].innerHTML.trim();
                  if (
                    terminusText.includes('↓') ||
                    terminusText.includes('内环')
                  ) {
                    (terminalOffsets[0] as number[]).push(i + j + 1);
                  } else {
                    (terminalOffsets[1] as number[]).push(i + j + 1);
                  }
                }
              } else {
                for (let j = 0; j < orientationWidth; j++) {
                  let terminusText = child_termini[i + j].innerHTML.trim();
                  if (
                    terminusText.includes('↓') ||
                    terminusText.includes('内环')
                  ) {
                    (terminalOffsets[2] as number[]).push(i + j + 1);
                  } else {
                    (terminalOffsets[3] as number[]).push(i + j + 1);
                  }
                }
              }
              i += orientationWidth;
              if (i >= dayWidth) {
                break;
              }
            }
            for (let i = 0; i < terminalOffsets.length; i++) {
              const v = terminalOffsets[i];
              terminalOffsets[i] = v instanceof Array ? v[0] : v;
            }
          } else {
            throw termini.length;
          }

          let rows = Array.from(table.tBodies[0].rows).map((row) =>
            Array.from(row.cells),
          );
          let timetable = new Map();

          for (var row of rows) {
            if (row.length == 0) {
              break;
            }
            let name = row[0].innerHTML.trim().replace('航站楼', '');
            if (!name || name == '--') {
              break;
            }

            timetable.set(
              name,
              dayOffsets.map((dayOffset) => {
                let closed = // 判断车站是否关闭
                  row
                    .slice(1)
                    .filter((cell) => cell.innerHTML.trim().length > 2)
                    .length == 0;
                return [
                  [
                    getItemsTextByIndex(
                      row,
                      terminalOffsets[0],
                      dayOffset,
                      closed,
                    ),
                    getItemsTextByIndex(
                      row,
                      terminalOffsets[1],
                      dayOffset,
                      closed,
                    ),
                  ],
                  [
                    getItemsTextByIndex(
                      row,
                      terminalOffsets[2],
                      dayOffset,
                      closed,
                    ),
                    getItemsTextByIndex(
                      row,
                      terminalOffsets[3],
                      dayOffset,
                      closed,
                    ),
                  ],
                ];
              }),
            );
          }

          navigator.clipboard.writeText(
            luaifyTimetable(
              timetable,
              Math.max(...[...timetable.keys()].map((str) => wcwidth(str))) + 4,
            ),
          );
        };

        let button = document.createElement('a');
        button.append('导出');
        button.addEventListener('click', copyData, false);

        button.style.cursor = 'pointer';
        button.style.position = 'absolute';
        button.style.zIndex = '1';
        button.style.color = 'white';
        button.style.opacity = '.75';
        button.style.paddingInlineStart = '.5em';

        caption?.appendChild(button);
      });
  },
};

export default CRT;
