#pragma once

#include <cstdint>
#include <deque>
#include <functional>
#include <map>
#include <string>
#include <unordered_set>
#include <vector>

namespace tradelab {

// Prices are integer cents. Avoid floating-point equality in matching logic.
enum class Side { Buy, Sell };
struct Order {
    std::string id;
    Side side;
    std::int64_t price_cents;
    std::int64_t quantity;
};
struct Trade {
    std::string maker_id;
    std::string taker_id;
    std::int64_t price_cents;
    std::int64_t quantity;
};

// One book per symbol. A single owner calls it sequentially; no shared locks.
class OrderBook {
public:
    std::vector<Trade> add(Order order);
    bool cancel(const std::string& id);
    std::int64_t resting_quantity(const std::string& id) const;

private:
    using Queue = std::deque<Order>;
    std::map<std::int64_t, Queue, std::greater<>> bids_;
    std::map<std::int64_t, Queue> asks_;
    // IDs cannot be reused within the lifetime of a book, even after a fill.
    std::unordered_set<std::string> seen_ids_;
};
} // namespace tradelab
