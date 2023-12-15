import pad from 'pad';

function assert(condition: boolean, message: string = null) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

type NestedArray<T> = T | NestedArray<T>[];
type NestedStringArray = NestedArray<string>;
interface FixedArray<T, L extends number> extends Array<T> {
  length: L;
}

type FirstPerTerminal = string;
type FirstPerDay<L extends number> = FixedArray<FirstPerTerminal, L>;
type LastPerTerminal<L extends number> = L extends 1
  ? string
  : FixedArray<string, L>;
type LastPerDay<L extends readonly number[]> = {
  [K in keyof L]: LastPerTerminal<L[K]>;
};
type TimePerDay<L extends readonly number[]> = [
  FirstPerDay<L['length']>,
  LastPerDay<L>
];
type Timetable<D extends number, L extends readonly number[]> = Map<
  string,
  FixedArray<TimePerDay<L>, D>
>;

type FlexFirstPerTerminal = FirstPerTerminal;
type FlexFirstPerDay = FlexFirstPerTerminal[];
type FlexLastPerTerminal = string | string[];
type FlexLastPerDay = FlexLastPerTerminal[];
type FlexTimePerDay = [FlexFirstPerDay, FlexLastPerDay];
type FlexTimetable = Map<string, FlexTimePerDay[]>;

function compareNestedStringArray(
  x: NestedStringArray,
  y: NestedStringArray
): boolean {
  if (x instanceof Array) {
    if (x.length != y.length) {
      return false;
    } else {
      return x.filter((v, i) => !compareNestedStringArray(v, y[i])).length == 0;
    }
  } else {
    return x === y;
  }
}

function deduplicateDays(timetable: FlexTimetable) {
  let dedup = true;
  timetable.forEach((days) => {
    if (days.length > 1) {
      days.slice(1).forEach((day) => {
        if (!compareNestedStringArray(days[0], day)) {
          dedup = false;
        }
      });
    }
  });
  if (dedup) {
    return new Map(
      Array.from(timetable.entries()).map(([station, days]) => [
        station,
        [days[0]],
      ])
    );
  } else {
    return timetable;
  }
}

function luaifyNestedStringArray(
  array: NestedStringArray,
  padding: number = 0
): string {
  if (array instanceof Array) {
    return `{ ${array
      .map((child) => luaifyNestedStringArray(child, padding))
      .join(', ')} }`;
  } else if (array == 'nil') {
    return pad(padding, `nil`);
  } else {
    return pad(padding, `'${array}'`);
  }
}

/**
 * 将时刻表对象序列化为Lua对象
 * @param timetable 时刻表
 * @param padding 站名文本宽度
 * @returns Lua对象字符串
 */
function luaifyTimetable(timetable: FlexTimetable, padding: number) {
  timetable = deduplicateDays(timetable);
  return `\t\t{
\t\t\tstations = ${luaifyNestedStringArray([...timetable.keys()])},
\t\t\tdata = {
${Array.from(timetable)
  .map(
    ([key, value]) =>
      `\t\t\t\t${pad(`['${key}']`, padding)} = ${luaifyNestedStringArray(value, 7)},`
  )
  .join('\n')}
\t\t\t}
\t\t}`;
}

export { assert, luaifyTimetable };
