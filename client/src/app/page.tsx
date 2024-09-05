import type { NextPage } from "next";
import LoadingWrapper from "../components/LoadingWrapper";
import RouterDashboard from "../components/RouterDashboard";

const Home: NextPage = () => {
  return (
    <LoadingWrapper>
      <RouterDashboard />
    </LoadingWrapper>
  );
};

export default Home;
