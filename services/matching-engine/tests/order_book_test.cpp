#include "tradelab/order_book.hpp"
#include <gtest/gtest.h>
#include <stdexcept>

using namespace tradelab;

TEST(OrderBook, MatchesBestPriceBeforeArrivalTime) {
    OrderBook book;
    book.add({"expensive", Side::Sell, 105, 10});
    book.add({"cheap", Side::Sell, 100, 10});
    const auto trades = book.add({"buyer", Side::Buy, 105, 15});
    ASSERT_EQ(trades.size(), 2u);
    EXPECT_EQ(trades[0].maker_id, "cheap");
    EXPECT_EQ(trades[0].price_cents, 100);
    EXPECT_EQ(trades[1].quantity, 5);
    EXPECT_EQ(book.resting_quantity("expensive"), 5);
}
TEST(OrderBook, PreservesFifoAtTheSamePrice) {
    OrderBook book;
    book.add({"first", Side::Buy, 100, 5});
    book.add({"second", Side::Buy, 100, 5});
    const auto trades = book.add({"seller", Side::Sell, 99, 7});
    ASSERT_EQ(trades.size(), 2u);
    EXPECT_EQ(trades[0].maker_id, "first");
    EXPECT_EQ(trades[0].price_cents, 100);
    EXPECT_EQ(trades[1].maker_id, "second");
    EXPECT_EQ(book.resting_quantity("second"), 3);
}
TEST(OrderBook, DoesNotCrossOutsideTheLimit) {
    OrderBook book;
    book.add({"ask", Side::Sell, 101, 10});
    EXPECT_TRUE(book.add({"bid", Side::Buy, 100, 5}).empty());
    EXPECT_EQ(book.resting_quantity("ask"), 10);
    EXPECT_EQ(book.resting_quantity("bid"), 5);
}
TEST(OrderBook, RestsUnfilledRemainderAndCancelsIt) {
    OrderBook book;
    book.add({"ask", Side::Sell, 100, 3});
    book.add({"bid", Side::Buy, 100, 8});
    EXPECT_EQ(book.resting_quantity("bid"), 5);
    EXPECT_TRUE(book.cancel("bid"));
    EXPECT_EQ(book.resting_quantity("bid"), 0);
    EXPECT_FALSE(book.cancel("bid"));
    EXPECT_FALSE(book.cancel("unknown"));
}
TEST(OrderBook, RejectsInvalidAndReusedIds) {
    OrderBook book;
    EXPECT_THROW(book.add({"", Side::Buy, 100, 5}), std::invalid_argument);
    EXPECT_THROW(book.add({"bad", Side::Buy, 0, 5}), std::invalid_argument);
    EXPECT_THROW(book.add({"bad", Side::Buy, 100, -1}), std::invalid_argument);
    book.add({"id", Side::Buy, 100, 5});
    EXPECT_THROW(book.add({"id", Side::Buy, 100, 5}), std::invalid_argument);
    book.cancel("id");
    EXPECT_THROW(book.add({"id", Side::Buy, 100, 5}), std::invalid_argument);
}
