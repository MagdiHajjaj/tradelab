#include "tradelab/order_book.hpp"
#include <iostream>

int main() {
    tradelab::OrderBook book;
    book.add({"sell-1", tradelab::Side::Sell, 22842, 10});
    for (const auto& trade : book.add({"buy-1", tradelab::Side::Buy, 22845, 6})) {
        std::cout << "Matched " << trade.quantity << " shares at " << trade.price_cents
                  << " cents; maker=" << trade.maker_id << ", taker=" << trade.taker_id << '\n';
    }
    std::cout << "Remaining sell quantity: " << book.resting_quantity("sell-1") << '\n';
}
