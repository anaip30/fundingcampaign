// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// Uvoz iz Hardhata koji omogućuje console.log unutar Solidity-ja
import "hardhat/console.sol";

contract Crowdfunding {
    struct Campaign {
        address creator;
        address payable beneficiary;
        string  description;
        string  title;
        uint    goal;
        uint    pledged;
        uint    deadline;
        bool    claimed;
    }

    uint public campaignCount;
    mapping(uint => Campaign) public campaigns;
    mapping(uint => mapping(address => uint)) public pledges;

    event CampaignCreated(uint id, address owner, uint goal, uint deadline);
    event Pledged(uint id, address indexed funder, uint amount);
    event Withdrawn(uint id, address owner, uint amount);
    event Refunded(uint id, address indexed funder, uint amount);

    modifier validCampaign(uint _id) {
        require(_id >= 1 && _id <= campaignCount, "Campaign ne postoji");
        _;
    }

    function createCampaign(
        string calldata _title,
        string calldata _description,
        uint _goal,
        uint _duration,
        address payable _beneficiary
    ) external {
        require(_goal > 0, "Goal > 0");
        require(_duration > 0, "Duration > 0");

        campaignCount += 1;
        campaigns[campaignCount] = Campaign({
            creator:    msg.sender,
            title:    _title,
            beneficiary: _beneficiary,
            description: _description,
            goal:     _goal,
            pledged:  0,
            deadline: block.timestamp + _duration,
            claimed:  false
        });

        // Ispiši u Hardhat terminal (samo na localhost mreži)
        console.log(">> [Solidity] Kreirana kampanja ID =", campaignCount);
        console.log("   owner:", msg.sender);
        console.log("   title:", _title);
        console.log("   goal (wei):", _goal);
        console.log("   deadline (timestamp):", block.timestamp + _duration);

        emit CampaignCreated(
            campaignCount,
            msg.sender,
            _goal,
            block.timestamp + _duration
        );
    }

    function pledge(uint _id) external payable validCampaign(_id) {
        Campaign storage camp = campaigns[_id];
        require(block.timestamp < camp.deadline, "Campaign je gotov");

        camp.pledged += msg.value;
        pledges[_id][msg.sender] += msg.value;

        console.log(">> [Solidity] Uplata na kampanju ID =", _id);
        console.log("   funder:", msg.sender);
        console.log("   iznos (wei):", msg.value);
        console.log("   ukupan pledged (wei):", camp.pledged);

        emit Pledged(_id, msg.sender, msg.value);
    }

    function withdraw(uint _id) external validCampaign(_id) {
        Campaign storage camp = campaigns[_id];
        require(msg.sender == camp.creator, "Niste kreator kampanje");
        require(block.timestamp >= camp.deadline, "Campaign nije gotov");
        require(camp.pledged >= camp.goal, "Goal nije dosegnut");
        require(!camp.claimed, "Vec isplaceno");

        camp.claimed = true;
        uint amount = camp.pledged;
        camp.beneficiary.transfer(amount);

        console.log(">> [Solidity] Withdraw kampanje ID =", _id);
        console.log("   owner:", msg.sender);
        console.log("   amount (wei):", amount);

        emit Withdrawn(_id, msg.sender, amount);
    }

    function refund(uint _id) external validCampaign(_id) {
        Campaign storage camp = campaigns[_id];
        require(block.timestamp >= camp.deadline, "Campaign nije gotov");
        require(camp.pledged < camp.goal, "Goal je dosegnut");

        uint bal = pledges[_id][msg.sender];
        require(bal > 0, "Nema uplate za refund");

        pledges[_id][msg.sender] = 0;
        payable(msg.sender).transfer(bal);

        console.log(">> [Solidity] Refund kampanje ID =", _id);
        console.log("   donator:", msg.sender);
        console.log("   amount (wei):", bal);

        emit Refunded(_id, msg.sender, bal);
    }

    function getCampaigns() external view returns (Campaign[] memory) {
        Campaign[] memory ret = new Campaign[](campaignCount);
        for (uint i = 0; i < campaignCount; i++) {
            ret[i] = campaigns[i + 1];
        }
        return ret;
    }
}