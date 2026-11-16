PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)

Plus Jakarta Sans 400 and 700 (static TTF, v2.071), SIL Open Font License 1.1,
Copyright 2020 The Plus Jakarta Sans Project Authors (https://github.com/tokotype/PlusJakartaSans).
Same family and weights the site loads via next/font (SPEC §4.8). Used ONLY by ../build.mjs to set
text inside generated PNG/JPEG assets (OG card, certificate, badges). The web page never loads these
files; it keeps using next/font. In packages/brand the worker would bundle the same two files.
