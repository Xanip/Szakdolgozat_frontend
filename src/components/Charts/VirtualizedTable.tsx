import React, { useMemo, useRef } from 'react'
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  filterFn_equals,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

// --------------------------------------------------
// 1. A táblázat alapbeállításai
// --------------------------------------------------
const DEFAULT_CELL_WIDTH = 180

// Extra funkciók: oszlopszűrés (a szűrőket kívülről kapja a táblázat).
const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
})

// --------------------------------------------------
// 2. A komponens bemeneti típusai
// --------------------------------------------------

// Egy cella tetszőleges értéket tartalmazhat. Explicit típusként
// használjuk, hogy az accessor ne `unknown`-ra, hanem valódi
// értéktípusra oldódjon fel (különben DisplayColumnDef lenne).
type CellValue = React.ReactNode | Date | bigint | object

// Rekord = tetszőleges számú és típusú cellák.
type MatrixRow = CellValue[]

// Egy oszlopszűrő: a `column` fejlécű oszlopban csak a value-val pontosan egyező cellájú sorok maradnak meg.
export interface TableColumnFilter {
  column: string,
  value: unknown,
}

interface VirtualTableProps {
  headers: string[],
  columnWidths?: number[],
  data: MatrixRow[],
  columnFilters?: readonly TableColumnFilter[],
  renderCell?: (
    value: unknown,
    rowIndex: number,
    columnIndex: number,
  ) => React.ReactNode
}

// A Table v9 oszlopsegédje a mátrix egy-egy indexét fogja olvasni.
const columnHelper = createColumnHelper<typeof features, MatrixRow>()

// --------------------------------------------------
// 3. Cellák alapértelmezett megjelenítése
// --------------------------------------------------

function formatCellValue(value: unknown): React.ReactNode {
  // A React-elemeket közvetlenül megjeleníthetjük.
  if (React.isValidElement(value)) {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }

  if (value instanceof Date) {
    return value.toLocaleString('hu-HU')
  }

  // Összetett objektumoknál JSON-szöveget mutatunk.
  try {
    return JSON.stringify(value) ?? String(value)
  } catch {
    return String(value)
  }
}

// --------------------------------------------------
// 4. A VirtualTable komponens
// --------------------------------------------------

export function VirtualizedTable({
  headers,
  columnWidths,
  data,
  columnFilters,
  renderCell,
}: VirtualTableProps) {
  // A görgethető HTML-elem referenciája. Ezt figyeli majd a virtualizáló.
  const containerRef = useRef<HTMLDivElement>(null)

  // Ha kívülről adtak meg szélességeket, minden oszlopra meg kell adni.
  const columnWidthsMismatch = columnWidths !== undefined && columnWidths.length !== headers.length

  // Ellenőrizzük, hogy minden adatsorban ugyanannyi cella van-e, mint ahány fejlécet megadtunk.
  const invalidRowIndex = useMemo(
    () =>
      data.findIndex(
        (row) =>
          !Array.isArray(row) ||
          row.length !== headers.length,
      ),
    [headers, data],
  )

  // A fejléc alapján megadott szűrők átalakítása a Table v9 oszlopazonosítóira.
  const unknownFilterColumn = columnFilters?.find((filter) => !headers.includes(filter.column))?.column
  const tableColumnFilters = useMemo(
    () =>
      (columnFilters ?? []).map((filter) => ({
        id: `column-${headers.indexOf(filter.column)}`,
        value: filter.value,
      })),
    [headers, columnFilters],
  )

  // Az oszlopok tényleges szélességei: a megadott tömb, vagy az alapértelmezett szélesség.
  const widths = columnWidths ?? headers.map(() => DEFAULT_CELL_WIDTH)
  const tableWidth = widths.reduce((sum, width) => sum + width, 0)

  // ------------------------------------------------
  // 5. Oszlopdefiníciók létrehozása
  // ------------------------------------------------

  const columns = useMemo(
    () =>
      columnHelper.columns(
        headers.map((header, columnIndex) =>
          columnHelper.accessor(
            (row): CellValue => row[columnIndex] as CellValue,
            {
              id: `column-${columnIndex}`,
              header,
              filterFn: filterFn_equals,
              cell: (info) => renderCell? renderCell(info.getValue(),info.row.index,columnIndex,): formatCellValue(info.getValue()),
            },
          ),
        ),
      ),
    [headers, renderCell],
  )

  // ------------------------------------------------
  // 6. A TanStack Table modellje
  // ------------------------------------------------

  const table = useTable(
    {
      features,
      columns,
      data,
      state: { columnFilters: tableColumnFilters },
    },
    (state) => state,
  )

  // A Table v9 által előállított sorok.
  const { rows } = table.getRowModel()

  // ------------------------------------------------
  // 7. Virtualizáció mért sormagassággal
  // ------------------------------------------------

  const rowVirtualizer = useVirtualizer<HTMLDivElement,HTMLTableRowElement>({
    // A virtualizálható adatsorok száma.
    count: rows.length,

    // Becsült sormagasság; a tényleges magasságot mérjük.
    estimateSize: () => 50,

    // A görgetést figyelő HTML-elem.
    getScrollElement: () => containerRef.current,

    overscan: 5,
    measureElement: (element) => element.getBoundingClientRect().height,
  })

  // ------------------------------------------------
  // 8. Hibás adatszerkezet kezelése
  // ------------------------------------------------

  // A hookokat a feltételes visszatérés előtt hívtuk meg,
  // így a komponens hook-sorrendje stabil marad.
  if (columnWidthsMismatch) {
    return (
      <div role="alert" className="heatmap-empty">
        Hibás táblázatbeállítás: a megadott oszlopszélességek
        száma ({columnWidths.length}) nem egyezik a fejlécek
        számával ({headers.length}).
      </div>
    )
  }

  if (unknownFilterColumn !== undefined) {
    return (
      <div role="alert" className="heatmap-empty">
        Hibás táblázatszűrő: nincs „{unknownFilterColumn}” nevű oszlop.
      </div>
    )
  }

  if (invalidRowIndex !== -1) {
    return (
      <div role="alert" className="heatmap-empty">
        Hibás táblázatadat: a(z) {invalidRowIndex + 1}.
        sorban a cellák száma nem egyezik a fejlécek számával.
        Elvárt oszlopszám: {headers.length}.
      </div>
    )
  }

  // ------------------------------------------------
  // 9. Fejléc és virtualizált sorok megjelenítése
  // ------------------------------------------------

  return (
    <div className="heatmap vtable">
      <div ref={containerRef} className="heatmap-scroll" tabIndex={0}>
        <table className="vtable-table" style={{ width: tableWidth }}>
          {/* Sticky header */}
          <thead className="heatmap-col-header">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="vtable-row vtable-header-row"
                style={{ width: tableWidth }}
              >
                {headerGroup.headers.map((header, columnIndex) => (
                  <th
                    key={header.id}
                    className="vtable-th"
                    style={{ width: widths[columnIndex] }}
                  >
                    <table.FlexRender header={header} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody
            className="heatmap-body"
            style={{
              height: rowVirtualizer.getTotalSize(),
              width: tableWidth,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]

              return (
                <tr
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={(node)=>{if(node){rowVirtualizer.measureElement(node)}}}
                  className="vtable-row vtable-body-row"
                  style={{
                    width: tableWidth,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getAllCells().map((cell, columnIndex) => (
                    <td
                      key={cell.id}
                      className="vtable-cell"
                      style={{ width: widths[columnIndex] }}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}