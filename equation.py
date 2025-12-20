import sympy as sp

class Equation:
    def __init__(self, lhs: sp.Expr, rhs: sp.Expr, transcendental: bool = False):
        self.params = list(lhs.free_symbols) + list(rhs.free_symbols)
        self.equation = sp.Eq(lhs, rhs)
        self.transcendental = transcendental
        self.solved = False

    def solve(self, params: dict[str, float]) -> float:
        unknown = []
        for param, value in params.items():
            if value is None:
                unknown.append(param)
        print(f'solving for {params}')
        print(f"unknown: {unknown}")
        if len(unknown) != 1:
            raise ValueError("Cannot solve an equation where unknowns != 1")
        unknown_var = unknown[0]
        params.pop(unknown_var)

        if self.transcendental:
            raise NotImplementedError("Transcendental equations are not supported yet.")
        else:
            solution = sp.solve(self.equation, unknown_var)
            return solution[0].evalf(subs=params)

    def solvable(self, known: list[sp.Basic]):
        if self.transcendental:
            raise NotImplementedError("Transcendental equations are not supported yet.")
        shared = [p for p in known if p in self.params]
        return len(shared) >= len(self.params) - 1
