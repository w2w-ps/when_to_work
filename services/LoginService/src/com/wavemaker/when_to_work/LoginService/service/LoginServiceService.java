package com.wavemaker.when_to_work.LoginService.service;


import com.wavemaker.when_to_work.LoginService.model.*;
import com.wavemaker.when_to_work.LoginService.model.RootRequest;
import com.wavemaker.when_to_work.LoginService.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface LoginServiceService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("POST /login")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",  })
  RootResponse invoke(RootRequest body);

}
