import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import { useDispatch, useSelector } from "react-redux";
import MobileGroupsTree from "./MobileGroupsTree";
import { headerActions } from "../../../redux/features/header.slice";

export default function GroupsTreeSideBar() {
  const groupsSideBar = useSelector((state) => state?.header?.groupsSideBar);
  const dispatch = useDispatch();

  //   const toggleDrawer = (newOpen) => () => {
  //     setOpen(newOpen);
  //   };

  //   const DrawerList = (
  //     <Box sx={{ width: 500 }} role="presentation" onClick={toggleDrawer(false)}>
  //       <List>
  //         {["Inbox", "Starred", "Send email", "Drafts"].map((text, index) => (
  //           <ListItem key={text} disablePadding>
  //             <ListItemButton>
  //               <ListItemIcon>
  //                 {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
  //               </ListItemIcon>
  //               <ListItemText primary={text} />
  //             </ListItemButton>
  //           </ListItem>
  //         ))}
  //       </List>
  //       <Divider />
  //       <List>
  //         {["All mail", "Trash", "Spam"].map((text, index) => (
  //           <ListItem key={text} disablePadding>
  //             <ListItemButton>
  //               <ListItemIcon>
  //                 {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
  //               </ListItemIcon>
  //               <ListItemText primary={text} />
  //             </ListItemButton>
  //           </ListItem>
  //         ))}
  //       </List>
  //     </Box>
  //   );

  const toggleDrawer = () => {
    dispatch(headerActions.setGroupsSideBar());
  };

  return (
    <div className="groups_tree_side_bar_container">
      <Drawer
        open={groupsSideBar}
        onClose={toggleDrawer}
        style={{
          zIndex: 999,
        }}
        className="groups_tree_side_bar_drawer_container"
      >
        <Box sx={{ width: 300 }} role="presentation">
          <MobileGroupsTree />
        </Box>
      </Drawer>
    </div>
  );
}
