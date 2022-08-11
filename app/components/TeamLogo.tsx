import { FiSettings } from "react-icons/fi"
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  useColorModeValue,
  useDisclosure,
  useTheme,
} from "@chakra-ui/react"

import { transformImage } from "~/lib/helpers/image"
import { useSelectedTeam } from "~/lib/hooks/useSelectedTeam"
import type { SidebarTeam } from "~/pages/_timeline.index"

import { TeamSettingsModal } from "./TeamSettingsModal"

interface Props {
  team: SidebarTeam
}

export function TeamLogo({ team }: Props) {
  const { selectedTeamId, setSelectedTeamId } = useSelectedTeam()
  const theme = useTheme()
  const modalProps = useDisclosure()
  const color = useColorModeValue("gray.800", "white")
  const bg = useColorModeValue("gray.100", "gray.700")
  const bgHover = useColorModeValue("gray.200", "gray.600")

  return (
    <Box key={team.id} pos="relative" sx={{ "&:hover .team-settings": { display: "flex" } }}>
      <Button
        display="flex"
        onClick={() => setSelectedTeamId(team.id)}
        variant="unstyled"
        boxSize="42px"
        bg="transparent"
        borderRadius="full"
      >
        <Avatar
          border={`3px solid ${team.id === selectedTeamId ? theme.colors.orange[500] : "transparent"}`}
          _hover={{
            borderColor: team.id === selectedTeamId ? theme.colors.orange[500] : theme.colors.orange[300],
          }}
          boxSize="42px"
          color={color}
          bg="transparent"
          name={team.name}
          src={team.logo ? transformImage(team.logo, "w_100,h_100") : undefined}
        />
      </Button>
      <IconButton
        display="none"
        pos="absolute"
        variant="solid"
        bg={bg}
        _hover={{ bg: bgHover }}
        color={color}
        onClick={modalProps.onOpen}
        bottom={-2}
        right={-2}
        borderRadius="full"
        icon={<Box boxSize="14px" as={FiSettings} />}
        boxSize="24px"
        minW="24px"
        aria-label="team settings"
        className="team-settings"
      />
      <Modal size="xl" {...modalProps}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <TeamSettingsModal team={team} />
        </ModalContent>
      </Modal>
    </Box>
  )
}
