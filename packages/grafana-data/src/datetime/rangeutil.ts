import each from 'lodash/each';
import groupBy from 'lodash/groupBy';

import { RawTimeRange, TimeRange, TimeZone } from '../types/time';

import * as dateMath from './datemath';
import { isDateTime } from './moment_wrapper';
import { timeZoneAbbrevation, dateTimeFormat, dateTimeFormatTimeAgo } from './formatter';
import { dateTimeParse } from './parser';

const spans: { [key: string]: { display: string; section?: number } } = {
  s: { display: '秒' },
  m: { display: '分' },
  h: { display: '小时' },
  d: { display: '天' },
  w: { display: '周' },
  M: { display: '月' },
  y: { display: '年' },
};

const rangeOptions = [
  { from: 'now/d', to: 'now/d', display: '最近一天', section: 2 },
  { from: 'now/d', to: 'now', display: '今天到现在', section: 2 },
  { from: 'now/w', to: 'now/w', display: '最近一周', section: 2 },
  { from: 'now/w', to: 'now', display: '本周到现在', section: 2 },
  { from: 'now/M', to: 'now/M', display: '最近一个月', section: 2 },
  { from: 'now/M', to: 'now', display: '本月到现在', section: 2 },
  { from: 'now/y', to: 'now/y', display: '最近一年', section: 2 },
  { from: 'now/y', to: 'now', display: '今年到现在', section: 2 },

  { from: 'now-1d/d', to: 'now-1d/d', display: '昨天', section: 1 },
  {
    from: 'now-2d/d',
    to: 'now-2d/d',
    display: '前天',
    section: 1,
  },
  {
    from: 'now-7d/d',
    to: 'now-7d/d',
    display: '上周同一天',
    section: 1,
  },
  { from: 'now-1w/w', to: 'now-1w/w', display: '上周', section: 1 },
  { from: 'now-1M/M', to: 'now-1M/M', display: '上月', section: 1 },
  { from: 'now-1y/y', to: 'now-1y/y', display: '去年', section: 1 },

  { from: 'now-5m', to: 'now', display: '最近5分钟', section: 3 },
  { from: 'now-15m', to: 'now', display: '最近15分钟', section: 3 },
  { from: 'now-30m', to: 'now', display: '最近30分钟', section: 3 },
  { from: 'now-1h', to: 'now', display: '最近1小时', section: 3 },
  { from: 'now-3h', to: 'now', display: '最近3小时, section: 3 },
  { from: 'now-6h', to: 'now', display: '最近6小时', section: 3 },
  { from: 'now-12h', to: 'now', display: '最近12小时', section: 3 },
  { from: 'now-24h', to: 'now', display: '最近24小时', section: 3 },
  { from: 'now-2d', to: 'now', display: '最近2天', section: 0 },
  { from: 'now-7d', to: 'now', display: '最近7天', section: 0 },
  { from: 'now-30d', to: 'now', display: '最近30天', section: 0 },
  { from: 'now-90d', to: 'now', display: '最近90天', section: 0 },
  { from: 'now-6M', to: 'now', display: '最近6个月', section: 0 },
  { from: 'now-1y', to: 'now', display: '最近1年', section: 0 },
  { from: 'now-2y', to: 'now', display: '最近2年', section: 0 },
  { from: 'now-5y', to: 'now', display: '最近5年', section: 0 },
];

const hiddenRangeOptions = [
  { from: 'now', to: 'now+1m', display: 'Next minute', section: 3 },
  { from: 'now', to: 'now+5m', display: 'Next 5 minutes', section: 3 },
  { from: 'now', to: 'now+15m', display: 'Next 15 minutes', section: 3 },
  { from: 'now', to: 'now+30m', display: 'Next 30 minutes', section: 3 },
  { from: 'now', to: 'now+1h', display: 'Next hour', section: 3 },
  { from: 'now', to: 'now+3h', display: 'Next 3 hours', section: 3 },
  { from: 'now', to: 'now+6h', display: 'Next 6 hours', section: 3 },
  { from: 'now', to: 'now+12h', display: 'Next 12 hours', section: 3 },
  { from: 'now', to: 'now+24h', display: 'Next 24 hours', section: 3 },
  { from: 'now', to: 'now+2d', display: 'Next 2 days', section: 0 },
  { from: 'now', to: 'now+7d', display: 'Next 7 days', section: 0 },
  { from: 'now', to: 'now+30d', display: 'Next 30 days', section: 0 },
  { from: 'now', to: 'now+90d', display: 'Next 90 days', section: 0 },
  { from: 'now', to: 'now+6M', display: 'Next 6 months', section: 0 },
  { from: 'now', to: 'now+1y', display: 'Next year', section: 0 },
  { from: 'now', to: 'now+2y', display: 'Next 2 years', section: 0 },
  { from: 'now', to: 'now+5y', display: 'Next 5 years', section: 0 },
];

const rangeIndex: any = {};
each(rangeOptions, (frame: any) => {
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
});
each(hiddenRangeOptions, (frame: any) => {
  rangeIndex[frame.from + ' to ' + frame.to] = frame;
});

export function getRelativeTimesList(timepickerSettings: any, currentDisplay: any) {
  const groups = groupBy(rangeOptions, (option: any) => {
    option.active = option.display === currentDisplay;
    return option.section;
  });

  // _.each(timepickerSettings.time_options, (duration: string) => {
  //   let info = describeTextRange(duration);
  //   if (info.section) {
  //     groups[info.section].push(info);
  //   }
  // });

  return groups;
}

// handles expressions like
// 5m
// 5m to now/d
// now/d to now
// now/d
// if no to <expr> then to now is assumed
export function describeTextRange(expr: any) {
  const isLast = expr.indexOf('+') !== 0;
  if (expr.indexOf('now') === -1) {
    expr = (isLast ? 'now-' : 'now') + expr;
  }

  let opt = rangeIndex[expr + ' to now'];
  if (opt) {
    return opt;
  }

  if (isLast) {
    opt = { from: expr, to: 'now' };
  } else {
    opt = { from: 'now', to: expr };
  }

  const parts = /^now([-+])(\d+)(\w)/.exec(expr);
  if (parts) {
    const unit = parts[3];
    const amount = parseInt(parts[2], 10);
    const span = spans[unit];
    if (span) {
      opt.display = isLast ? 'Last ' : 'Next ';
      opt.display += amount + ' ' + span.display;
      opt.section = span.section;
      if (amount > 1) {
        opt.display += 's';
      }
    }
  } else {
    opt.display = opt.from + ' to ' + opt.to;
    opt.invalid = true;
  }

  return opt;
}

/**
 * Use this function to get a properly formatted string representation of a {@link @grafana/data:RawTimeRange | range}.
 *
 * @example
 * ```
 * // Prints "2":
 * console.log(add(1,1));
 * ```
 * @category TimeUtils
 * @param range - a time range (usually specified by the TimePicker)
 * @alpha
 */
export function describeTimeRange(range: RawTimeRange, timeZone?: TimeZone): string {
  const option = rangeIndex[range.from.toString() + ' to ' + range.to.toString()];

  if (option) {
    return option.display;
  }

  const options = { timeZone };

  if (isDateTime(range.from) && isDateTime(range.to)) {
    return dateTimeFormat(range.from, options) + ' to ' + dateTimeFormat(range.to, options);
  }

  if (isDateTime(range.from)) {
    const parsed = dateMath.parse(range.to, true, 'utc');
    return parsed ? dateTimeFormat(range.from, options) + ' to ' + dateTimeFormatTimeAgo(parsed, options) : '';
  }

  if (isDateTime(range.to)) {
    const parsed = dateMath.parse(range.from, false, 'utc');
    return parsed ? dateTimeFormatTimeAgo(parsed, options) + ' to ' + dateTimeFormat(range.to, options) : '';
  }

  if (range.to.toString() === 'now') {
    const res = describeTextRange(range.from);
    return res.display;
  }

  return range.from.toString() + ' to ' + range.to.toString();
}

export const isValidTimeSpan = (value: string) => {
  if (value.indexOf('$') === 0 || value.indexOf('+$') === 0) {
    return true;
  }

  const info = describeTextRange(value);
  return info.invalid !== true;
};

export const describeTimeRangeAbbrevation = (range: TimeRange, timeZone?: TimeZone) => {
  if (isDateTime(range.from)) {
    return timeZoneAbbrevation(range.from, { timeZone });
  }
  const parsed = dateMath.parse(range.from, true);
  return parsed ? timeZoneAbbrevation(parsed, { timeZone }) : '';
};

export const convertRawToRange = (raw: RawTimeRange, timeZone?: TimeZone): TimeRange => {
  const from = dateTimeParse(raw.from, { roundUp: false, timeZone });
  const to = dateTimeParse(raw.to, { roundUp: true, timeZone });

  if (dateMath.isMathString(raw.from) || dateMath.isMathString(raw.to)) {
    return { from, to, raw };
  }

  return { from, to, raw: { from, to } };
};
