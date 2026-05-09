import { useParams } from "react-router-dom";

import TournamentView from "../components/TournamentView";

export default function TournamentViewPage() {

  const { id } = useParams();

  return (
    <TournamentView id={Number(id)} />
  );
}