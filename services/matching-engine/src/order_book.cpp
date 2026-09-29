#include "tradelab/order_book.hpp"

#include <algorithm>
#include <stdexcept>
#include <utility>

namespace tradelab {
namespace {
// The best price is the first level; arrival order is the deque order.
template <typename Levels, typename Crosses>
void match(Order& incoming, Levels& levels, Crosses crosses, std::vector<Trade>& trades) {
    while (incoming.quantity > 0 && !levels.empty()) {
        auto level = levels.begin();
        if (!crosses(level->first)) break;
        auto& queue = level->second;
        while (incoming.quantity > 0 && !queue.empty()) {
            auto& resting = queue.front();
            const auto quantity = std::min(incoming.quantity, resting.quantity);
            trades.push_back({resting.id, incoming.id, resting.price_cents, quantity});
            incoming.quantity -= quantity;
            resting.quantity -= quantity;
            if (resting.quantity == 0) queue.pop_front();
        }
        if (queue.empty()) levels.erase(level);
    }
}

template <typename Levels>
bool remove_order(Levels& levels, const std::string& id) {
    for (auto level = levels.begin(); level != levels.end(); ++level) {
        auto& queue = level->second;
        const auto order = std::find_if(queue.begin(), queue.end(), [&](const Order& o) { return o.id == id; });
        if (order == queue.end()) continue;
        queue.erase(order);
        if (queue.empty()) levels.erase(level);
        return true;
    }
    return false;
}
} // namespace

std::vector<Trade> OrderBook::add(Order order) {
    if (order.id.empty() || order.price_cents <= 0 || order.quantity <= 0 ||
        (order.side != Side::Buy && order.side != Side::Sell)) {
        throw std::invalid_argument("Order needs an ID, valid side, positive price and quantity");
    }
    if (!seen_ids_.insert(order.id).second) throw std::invalid_argument("Duplicate order ID");
    std::vector<Trade> trades;
    if (order.side == Side::Buy) {
        match(order, asks_, [&](auto price) { return price <= order.price_cents; }, trades);
        if (order.quantity > 0) bids_[order.price_cents].push_back(std::move(order));
    } else {
        match(order, bids_, [&](auto price) { return price >= order.price_cents; }, trades);
        if (order.quantity > 0) asks_[order.price_cents].push_back(std::move(order));
    }
    return trades;
}

bool OrderBook::cancel(const std::string& id) {
    return remove_order(bids_, id) || remove_order(asks_, id);
}

std::int64_t OrderBook::resting_quantity(const std::string& id) const {
    for (const auto& [price, queue] : bids_) {
        for (const auto& order : queue) if (order.id == id) return order.quantity;
    }
    for (const auto& [price, queue] : asks_) {
        for (const auto& order : queue) if (order.id == id) return order.quantity;
    }
    return 0;
}
} // namespace tradelab
