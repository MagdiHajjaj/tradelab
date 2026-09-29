# C++ matching engine

A small C++20 limit-order book. Learn matching semantics here before adding network transport.

Read `include/tradelab/order_book.hpp` → `src/order_book.cpp` → `tests/order_book_test.cpp`.

Requires CMake 3.24+, a C++20 compiler, and Git/network access for Google Test on the first configure. From the repository root:

```sh
cmake -S services/matching-engine -B build/engine -DCMAKE_BUILD_TYPE=Debug
cmake --build build/engine
ctest --test-dir build/engine --output-on-failure
```

The demo executable is `build/engine/matching_engine` on single-configuration Linux generators. On Visual Studio use `cmake --build build/engine --config Debug`, `ctest --test-dir build/engine -C Debug`, and `build/engine/Debug/matching_engine.exe`.

Example: a 10-share sell rests at 22,842 cents; a 6-share buy crosses it. Six shares execute at the resting price and four remain.

Orders are matched at best price first and arrival order second. The core supports partial fills and cancellation; prices are integer cents. It is single-thread owned, has no transport, and assumes one instance per symbol. IDs remain remembered for the lifetime of the instance. Market orders, persistence, and engine process management are future work.
