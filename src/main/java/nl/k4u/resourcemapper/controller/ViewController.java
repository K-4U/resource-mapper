package nl.k4u.resourcemapper.controller;

import lombok.RequiredArgsConstructor;
import nl.k4u.resourcemapper.service.ResourceService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
@RequiredArgsConstructor
public class ViewController {
    private final ResourceService resourceService;

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("groups", resourceService.getAllGroupInfo());
        model.addAttribute("servicesByGroup", resourceService.getAllServices());
        return "index";
    }

    @GetMapping("/group/{groupName}")
    public String groupView(@PathVariable String groupName, Model model) {
        model.addAttribute("groupName", groupName);
        model.addAttribute("groupInfo", resourceService.getGroupInfo(groupName).orElse(null));
        model.addAttribute("services", resourceService.getServicesByGroup(groupName));
        model.addAttribute("allServices", resourceService.getAllServices());
        return "group";
    }
}

