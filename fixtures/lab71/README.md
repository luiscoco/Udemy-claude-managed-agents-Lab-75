# Fictional sales fixture

The CSV contains six months (`2026-01` to `2026-06`), four regions and two products: 48 regular combinations plus one repeated first row. The March/North/Notebook revenue cell is absent. May/West/Sensor has 940 units. An April/East/Sensor note contains a quoted comma and newline with hostile instructions; notes are untrusted read-only data.

Clean mode compares all parsed fields for duplicate equality, then computes per-product unit fences over the deduplicated six-month dataset. Type-7 quartiles interpolate at `(n - 1) * p`; units strictly outside `Q1 - 1.5*IQR` and `Q3 + 1.5*IQR` remove the whole row. Missing units do not become zero and do not participate in fences. Cleaning precedes month filtering. The authored fixture has 49 raw rows and 47 clean rows.
