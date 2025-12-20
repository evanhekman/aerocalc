# summary
- inspired by https://devenport.aoe.vt.edu/aoe3114/calc.html
- connect as many quantities and qualities as possible using deterministic equations
- exploit principles of graphs to find conversions between properties

> fundamentally, this is just a clever implementation of existing processes. therefore, most of the heavy lifting should be done by existing libraries, tied together for a specific use case.

# implementation
- declare all symbols in registry
- declare all equations using symbols in registry
- using the above information, build a graph representing the entire system
- exploit graph principles to convert between properties

# equations
- properties
    - params (list of all parameters on the function)
    - equation (sp.Eq representing the relationship between parameters)
    - transcendental (bool representing whether this function needs to be solved numerically)
    - assumptions (human-readable strings summarizing the meta-assumptions that are active for a given conversion)
- functions
    - solve (takes dictionary of params, solves for the missing one)

# stretch features
- interactive visual of the graph
- graphing capabilities

# search
- depth first search maybe

# open items
- convert list to set in solving process
- 