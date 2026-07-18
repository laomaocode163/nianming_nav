/**
 * 只读数据导出工具（纯客户端）。
 * 通过 Blob + URL.createObjectURL 触发浏览器下载，不写入任何服务端/数据库。
 * 供后台只读面板导出当前查看的数据（JSON / CSV）。
 */

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** 导出为 JSON 文件 */
export const exportJson = (filename: string, data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
};

export interface CsvColumn<T> {
  /** 列标题 */
  header: string;
  /** 取值函数 */
  value: (row: T) => string | number | boolean | null | undefined;
}

const escapeCsv = (value: string | number | boolean | null | undefined): string => {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** 导出为 CSV 文件（带 UTF-8 BOM，便于 Excel 正确识别中文） */
export const exportCsv = <T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void => {
  const head = columns.map((c) => escapeCsv(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => escapeCsv(c.value(r))).join(',')).join('\r\n');
  const csv = `\uFEFF${head}\r\n${body}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
};
