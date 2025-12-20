from equation import Equation
import sympy as sp

class Graph:
    def __init__(self, parameters: list[sp.Basic], equations: list[Equation]):
        self.params = parameters
        self.equations = equations
    
    def solve_route(self, known: set[sp.Basic], missing: sp.Basic, equations: list[Equation]):
        """
        returns _all possible_ routes from the known parameters to the missing parameter.
        does this through DFS on the equations, adding any that can be solved 
        with the growing list of known variables.

        - known (list of parameters)
        - missing (parameter being searched for)
        - equations (all equations available for the graph)
        - solved (equations that have already been solved)

        - recursively calls a helper function that
        > returns the list of equations that needs to be solved to reach the missing parameter
        """
        return solve(known, missing, equations)

def solve(known: set[sp.Basic], missing: sp.Basic, equations: list[Equation]):
    """
    returns the list of equations that need to be solved to reach the missing parameter,
    or None if not solvable.

    > need to provide the path to the solution -> need to solve one at a time

    """
    if missing in known:
        return []

    for eq in equations:
        if eq.solvable(known) and not eq.solved:
            eq.solved = True
            for param in eq.params:
                known.add(param)
            follow = solve(known, missing, equations)
            if follow:
                follow.append(eq)
                return follow
    return None