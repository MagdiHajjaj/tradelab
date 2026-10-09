// Private, versioned pipe protocol. See docs/API.md before changing this format.
// Stdout contains JSON replies only; diagnostics must go to stderr.
#include "tradelab/order_book.hpp"
#include <algorithm>
#include <cctype>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

namespace {
bool valid_id(const std::string& id) {
    return !id.empty() && id.size() <= 64 && std::all_of(id.begin(), id.end(), [](unsigned char c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') ||
               (c >= '0' && c <= '9') || c == '-' || c == '_';
    });
}

void write_report(const tradelab::ExecutionReport& report, std::uint64_t sequence) {
    // IDs are restricted to ASCII tokens above, so these fields cannot inject JSON.
    std::cout << "{\"version\":1,\"sequence\":" << sequence
              << ",\"ok\":true,\"order_id\":\"" << report.order_id
              << "\",\"status\":\"" << report.status
              << "\",\"filled_quantity\":" << report.filled_quantity
              << ",\"remaining_quantity\":" << report.remaining_quantity
              << ",\"cancelled_quantity\":" << report.cancelled_quantity << ",\"trades\":[";
    bool first = true;
    for (const auto& trade : report.trades) {
        if (!first) std::cout << ',';
        first = false;
        std::cout << "{\"maker_id\":\"" << trade.maker_id << "\",\"taker_id\":\"" << trade.taker_id
                  << "\",\"price_cents\":" << trade.price_cents << ",\"quantity\":" << trade.quantity << '}';
    }
    std::cout << "]}" << std::endl;
}
} // namespace

int main() {
    tradelab::OrderBook book;
    std::uint64_t sequence = 0;
    std::string line;
    while (std::getline(std::cin, line)) {
        ++sequence;
        try {
            if (line.size() > 256) throw std::invalid_argument("invalid_command");
            std::istringstream input(line);
            std::string version, command, id, extra;
            if (!(input >> version >> command) || version != "v1") throw std::invalid_argument("invalid_command");
            tradelab::ExecutionReport report;
            if (command == "PING") {
                if (input >> extra) throw std::invalid_argument("invalid_command");
                report.status = "ready";
            } else if (command == "CANCEL") {
                if (!(input >> id) || !valid_id(id) || (input >> extra)) throw std::invalid_argument("invalid_command");
                report.order_id = id;
                report.cancelled_quantity = book.resting_quantity(id);
                if (!book.cancel(id)) throw std::invalid_argument("order_not_found");
                report.status = "cancelled";
            } else if (command == "SUBMIT") {
                std::string side, type;
                std::int64_t price = 0, quantity = 0;
                if (!(input >> id >> side >> type >> price >> quantity) || (input >> extra) ||
                    !valid_id(id) || (side != "buy" && side != "sell") ||
                    (type != "limit" && type != "market") || quantity < 1 || quantity > 1000000 ||
                    price < 0 || price > 100000000) throw std::invalid_argument("invalid_order");
                report = book.submit({id, side == "buy" ? tradelab::Side::Buy : tradelab::Side::Sell,
                    price, quantity, type == "limit" ? tradelab::OrderType::Limit : tradelab::OrderType::Market});
            } else {
                throw std::invalid_argument("invalid_command");
            }
            write_report(report, sequence);
        } catch (const std::invalid_argument& error) {
            std::cout << "{\"version\":1,\"sequence\":" << sequence
                      << ",\"ok\":false,\"error\":\"" << error.what() << "\"}" << std::endl;
        }
    }
}
