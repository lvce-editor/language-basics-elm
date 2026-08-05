module Operators exposing (matches)

matches left right =
    left /= right
        && left <= 10
        || right >= 20

combined =
    [ 1 ] ++ [ 2 ]
