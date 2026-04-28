package com.java.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.reactive.result.view.RedirectView;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class HomeController {

  @Value("${api-origin-uri}")
  private String origin_uri;
  
  @RequestMapping("/")
  public RedirectView home(RedirectView rv) {
    log.info("GateWay Service!!");
    rv.setUrl(origin_uri);
    return rv;
  }

}
