# Lab 71 checkpoint: data analysis and 71A verification

Lab 71/71A implements a bounded RFC 4180 CSV reader, the authored six-month sales fixture, explicit raw/clean quality rules, Type-7 product-unit IQR filtering, numeric reductions, ratios of eligible sums, period comparisons, computation C IDs, ledger-derived SVG chart G IDs and closed report verification. Host custom-tool handlers validate input, correlate `sevt_` results and deduplicate delivered events. Notes remain untrusted read-only data.

Independent fixtures test quoted newlines/delimiters, missing versus zero, all numeric reductions, ratio-of-sums versus mean-of-ratios, duplicate/outlier removal, quartiles, zero-base comparisons and tampered value/unit/quality/chart evidence. The scripted analyst and external report input use the same verifier. Numeric prose and uncited commentary are warnings; evidence membership cannot prove causality.

The focused analysis suite, typecheck, guide checks, build and browser chart/report demonstration are run for this checkpoint. Optional live analysis remains disabled without a dedicated custom-tool adapter; no provider session or billing was started. Ledgers are process-local and charts accept existing aggregate IDs only.
