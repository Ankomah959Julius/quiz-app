import React from 'react';

export default function DataTable({
  columns,
  rows,
  rowKey = (row, index) => row.id ?? index,
  caption,
  empty = 'No records found',
  className = ''
}) {
  return (
    <div className={`table-wrap ${className}`}>
      <table className="data-table">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.align ? { textAlign: col.align } : undefined}
                className={col.headerClassName || ''}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={rowKey(row, index)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.className || ''}
                    style={col.align ? { textAlign: col.align } : undefined}
                  >
                    {col.render ? col.render(row, index) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
