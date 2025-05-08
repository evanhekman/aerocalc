"""
Example of how I would like to use things internally.
"""

import sympy as sp

P, V, R, T = sp.symbols('P V R T')
eq = sp.Eq(P * V, R * T)

def solve(equation: sp.Eq, params: list[float]) -> float:
    known = params
    unknown = [var for var in (equation.lhs.free_symbols + equation.rhs.free_symbols) if var not in known]

    if len(unknown) != 1:
        raise ValueError("Cannot solve an equation where unknowns != 1")

    unknown_var = unknown[0]
    solution = sp.solve(equation, unknown_var)
    return solution

def main():
    params = {P: 20, V: 100, R: 50}
    expected = 40
    result = solve(eq, params)
    assert result == expected, f"Expected {expected}, but got {result}"

    params = {P: 2004, V: 200, R: 287}
    expected = 1397.212543554
    result = solve(eq, params)
    assert abs(result - expected) < 0.0001, f"Expected {expected}, but got {result}"