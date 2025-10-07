from typing import Sequence, Iterable, Any, Tuple, List, Dict
from sqlalchemy import text as sa_text

def _replace_qmarks(sql: str, n: int) -> Tuple[str, List[str]]:
    out, names, i = [], [], 0
    in_s = in_d = False
    
    for ch in sql:
        if ch == "'" and not in_d:
            in_s = not in_s
        elif ch == '"' and not in_s:
            in_d = not in_d
        
        if ch == "?" and not in_s and not in_d:
            i += 1
            name = f"p{i}"
            names.append(name)
            out.append(f":{name}")
        else:
            out.append(ch)
    
    if i != n:
        raise ValueError(f"qmark {i} != params {n}")
    
    return "".join(out), names

def qmark(sql: str, params: Sequence[Any]):
    if isinstance(params, dict):
        return sa_text(sql), params
    
    converted, names = _replace_qmarks(sql, len(params))
    return sa_text(converted), {k: v for k, v in zip(names, params)}

def qmark_many(sql: str, rows: Iterable[Sequence[Any]]):
    rows = list(rows)
    n = len(rows[0]) if rows else 0
    converted, names = _replace_qmarks(sql, n)
    dicts = [{names[i]: row[i] for i in range(n)} for row in rows]
    return sa_text(converted), dicts
