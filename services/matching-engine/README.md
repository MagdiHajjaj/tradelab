# C++ matching engine

A C++20 market/limit order book, a demo executable, and a pipe server managed by the Go gateway.

Read `include/tradelab/order_book.hpp` → `src/order_book.cpp` → `tests/order_book_test.cpp`.

Requires CMake 3.24+, a C++20 compiler, and Git/network access for Google Test on the first configure. From the repository root:

```sh
cmake -S services/matching-engine -B build/engine -DCMAKE_BUILD_TYPE=Debug
cmake --build build/engine
ctest --test-dir build/engine --output-on-failure
```

The demo executable is `build/engine/matching_engine` on single-configuration Linux generators. On Visual Studio use `cmake --build build/engine --config Debug`, `ctest --test-dir build/engine -C Debug`, and `build/engine/Debug/matching_engine.exe`.

Example: a 10-share sell rests at 22,842 cents; a 6-share buy crosses it. Six shares execute at the resting price and four remain.

Orders are matched at best price first and arrival order second. `submit()` returns an execution report; `add()` remains a convenience wrapper returning trades only. Limit remainders rest; market remainders are immediately cancelled. Prices are integer cents. Each book is single-thread owned, and IDs remain remembered for its lifetime.

`engine_server` reads the private v1 pipe protocol in `src/server.cpp`; the gateway starts one process per symbol. `matching_engine` remains the short offline example. See [the API guide](../../docs/API.md) for the protocol and [the code tour](../../docs/CODE_TOUR.md) for the reading order. Persistence and backend risk checks are future work.
