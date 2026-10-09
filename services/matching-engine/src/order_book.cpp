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

ExecutionReport OrderBook::submit(Order order) {
    const bool market = order.type == OrderType::Market;
    if (order.id.empty() || order.quantity <= 0 ||
        (market ? order.price_cents != 0 : order.price_cents <= 0) ||
        (order.side != Side::Buy && order.side != Side::Sell) ||
        (order.type != OrderType::Limit && order.type != OrderType::Market)) {
        throw std::invalid_argument("invalid_order");
    }
    if (!seen_ids_.insert(order.id).second) throw std::invalid_argument("duplicate_order_id");
    ExecutionReport report;
    report.order_id = order.id;
    const auto requested_quantity = order.quantity;
    if (order.side == Side::Buy) {
        match(order, asks_, [&](auto price) { return market || price <= order.price_cents; }, report.trades);
    } else {
        match(order, bids_, [&](auto price) { return market || price >= order.price_cents; }, report.trades);
    }
    report.filled_quantity = requested_quantity - order.quantity;
    if (market) {
        // Market orders are immediate-or-cancel: never leave a zero-price order resting.
        report.cancelled_quantity = order.quantity;
        report.status = order.quantity == 0 ? "filled" : "cancelled";
    } else {
        report.remaining_quantity = order.quantity;
        report.status = order.quantity == 0 ? "filled" :
            report.filled_quantity > 0 ? "partially_filled" : "open";
        if (order.quantity > 0) {
            if (order.side == Side::Buy) bids_[order.price_cents].push_back(std::move(order));
            else asks_[order.price_cents].push_back(std::move(order));
        }
    }
    return report;
}

std::vector<Trade> OrderBook::add(Order order) {
    return submit(std::move(order)).trades;
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
